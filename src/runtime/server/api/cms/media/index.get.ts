import { defineEventHandler, getQuery } from '#imports'
import { desc, asc, like, sql } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { useCmsDatabase, mediaSqlite, mediaPostgres, getDatabaseType } from '../../../database/client'
import { sanitizeSearchQuery } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const perPage = Math.min(Number(query.perPage) || 20, 100)
  const type = query.type as string | undefined
  // Sanitize search query to prevent SQL wildcard abuse
  const rawSearch = query.search as string | undefined
  const search = rawSearch ? sanitizeSearchQuery(rawSearch) : undefined
  const orderBy = (query.orderBy as 'createdAt' | 'filename' | 'size') || 'createdAt'
  const orderDir = (query.orderDir as 'asc' | 'desc') || 'desc'

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const mediaTable = isPostgres ? mediaPostgres : mediaSqlite

  // Build conditions
  const conditions: any[] = []

  if (type) {
    conditions.push(like(mediaTable.mimeType, `${type}%`))
  }

  if (search) {
    conditions.push(
      sql`(${mediaTable.filename} LIKE ${'%' + search + '%'} OR ${mediaTable.alt} LIKE ${'%' + search + '%'})`
    )
  }

  // Get total count
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(mediaTable)
  if (conditions.length > 0) {
    countQuery = countQuery.where(sql.join(conditions, sql` AND `)) as any
  }

  const countResult = await countQuery
  const total = Number(countResult[0]?.count || 0)

  // Calculate pagination
  const offset = (page - 1) * perPage
  const totalPages = Math.ceil(total / perPage)

  // Get order column
  const orderColumn = orderBy === 'filename' ? mediaTable.filename
    : orderBy === 'size' ? mediaTable.size
    : mediaTable.createdAt

  // Get items
  let itemsQuery = db
    .select()
    .from(mediaTable)
    .orderBy(orderDir === 'asc' ? asc(orderColumn) : desc(orderColumn))
    .limit(perPage)
    .offset(offset)

  if (conditions.length > 0) {
    itemsQuery = itemsQuery.where(sql.join(conditions, sql` AND `)) as any
  }

  const items = await itemsQuery

  return {
    data: items,
    meta: {
      total,
      page,
      perPage,
      totalPages
    }
  }
})
