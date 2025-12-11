import { defineEventHandler, getRouterParam, createError } from '#imports'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check read permission for roles
  await requirePermission(user, 'roles', 'read')

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

  const roles = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.id, id))
    .limit(1)

  if (roles.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Role not found'
    })
  }

  const role = roles[0]

  return {
    data: {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }
  }
})
