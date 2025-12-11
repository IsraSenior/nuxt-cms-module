import { defineEventHandler, getQuery } from '#imports'
import { desc, asc, sql, like } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, usersSqlite, usersPostgres, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check read permission for users
  await requirePermission(user, 'users', 'read')

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const perPage = Math.min(Number(query.perPage) || 20, 100)
  const search = query.search as string | undefined
  const orderBy = (query.orderBy as string) || 'createdAt'
  const orderDir = (query.orderDir as string) || 'desc'

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const usersTable = isPostgres ? usersPostgres : usersSqlite
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite

  // Build where conditions
  const conditions = []
  if (search) {
    conditions.push(
      sql`(${usersTable.username} LIKE ${`%${search}%`} OR ${usersTable.email} LIKE ${`%${search}%`})`
    )
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)

  const total = Number(countResult[0]?.count || 0)

  // Calculate pagination
  const offset = (page - 1) * perPage
  const totalPages = Math.ceil(total / perPage)

  // Get order column
  const orderColumn = orderBy === 'username' ? usersTable.username
    : orderBy === 'email' ? usersTable.email
    : usersTable.createdAt

  // Get users with role info
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
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
    .orderBy(orderDir === 'asc' ? asc(orderColumn) : desc(orderColumn))
    .limit(perPage)
    .offset(offset)

  // Map to safe user format
  const safeUsers = users.map(u => ({
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
  }))

  return {
    data: safeUsers,
    meta: {
      total,
      page,
      perPage,
      totalPages
    }
  }
})
