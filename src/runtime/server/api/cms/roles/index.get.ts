import { defineEventHandler, getQuery } from '#imports'
import { desc, asc } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check read permission for roles
  await requirePermission(user, 'roles', 'read')

  const query = getQuery(event)
  const orderBy = (query.orderBy as string) || 'createdAt'
  const orderDir = (query.orderDir as string) || 'asc'

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite

  // Get order column
  const orderColumn = orderBy === 'name' ? rolesTable.name
    : orderBy === 'displayName' ? rolesTable.displayName
    : rolesTable.createdAt

  // Get all roles
  const roles = await db
    .select()
    .from(rolesTable)
    .orderBy(orderDir === 'asc' ? asc(orderColumn) : desc(orderColumn))

  return {
    data: roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }))
  }
})
