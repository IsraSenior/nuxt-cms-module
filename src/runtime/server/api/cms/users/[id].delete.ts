import { defineEventHandler, getRouterParam, createError } from '#imports'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { requirePermission, isSuperAdmin } from '../../../utils/permissions'
import { useCmsDatabase, usersSqlite, usersPostgres, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuth(event)

  // Check delete permission for users
  await requirePermission(currentUser, 'users', 'delete')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  // Prevent self-deletion
  if (currentUser.id === id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot delete your own account'
    })
  }

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const usersTable = isPostgres ? usersPostgres : usersSqlite
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite

  // Check if user exists
  const existingUsers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1)

  if (existingUsers.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  const userToDelete = existingUsers[0]

  // Prevent deleting super_admin unless current user is also super_admin
  if (userToDelete.roleId) {
    const targetRole = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, userToDelete.roleId))
      .limit(1)

    if (targetRole.length > 0 && targetRole[0].name === 'super_admin') {
      const isSuper = await isSuperAdmin(currentUser)
      if (!isSuper) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Only super administrators can delete super_admin users'
        })
      }
    }
  }

  // Delete user
  await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))

  return {
    success: true
  }
})
