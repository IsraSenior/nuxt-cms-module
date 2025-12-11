import { defineEventHandler, getRouterParam, createError } from '#imports'
import { eq, sql } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, usersSqlite, usersPostgres, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check read permission for users
  await requirePermission(user, 'users', 'read')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const usersTable = isPostgres ? usersPostgres : usersSqlite
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite

  // Get user with role info
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      avatar: usersTable.avatar,
      role: usersTable.role,
      roleId: usersTable.roleId,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      roleName: rolesTable.name,
      roleDisplayName: rolesTable.displayName
    })
    .from(usersTable)
    .leftJoin(rolesTable, sql`${usersTable.roleId} = ${rolesTable.id}`)
    .where(eq(usersTable.id, id))
    .limit(1)

  if (users.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  const u = users[0]

  return {
    data: {
      id: u.id,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      roleId: u.roleId,
      roleName: u.roleName || u.role,
      roleDisplayName: u.roleDisplayName || u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }
  }
})
