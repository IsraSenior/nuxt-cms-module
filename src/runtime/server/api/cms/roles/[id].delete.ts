import { defineEventHandler, getRouterParam, createError } from '#imports'
import { eq, sql } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, rolesSqlite, rolesPostgres, usersSqlite, usersPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check manage permission for roles
  await requirePermission(user, 'roles', 'manage')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Role ID is required'
    })
  }

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite
  const usersTable = isPostgres ? usersPostgres : usersSqlite

  // Check if role exists
  const existingRoles = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.id, id))
    .limit(1)

  if (existingRoles.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Role not found'
    })
  }

  const roleToDelete = existingRoles[0]

  // Prevent deleting system roles
  if (roleToDelete.isSystem) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot delete system roles'
    })
  }

  // Check if any users are using this role
  const usersWithRole = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(eq(usersTable.roleId, id))

  const userCount = Number(usersWithRole[0]?.count || 0)

  if (userCount > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot delete role. ${userCount} user(s) are currently assigned to this role.`
    })
  }

  // Delete role
  await db
    .delete(rolesTable)
    .where(eq(rolesTable.id, id))

  return {
    success: true
  }
})
