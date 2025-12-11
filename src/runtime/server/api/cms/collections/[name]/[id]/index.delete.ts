import { defineEventHandler, getRouterParam, createError } from '#imports'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../../../../../utils/auth'
import { requirePermission } from '../../../../../utils/permissions'
import { useCmsDatabase, contentSqlite, contentPostgres, getDatabaseType } from '../../../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const name = getRouterParam(event, 'name')
  const id = getRouterParam(event, 'id')

  if (!name || !id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collection name and ID are required'
    })
  }

  // Check delete permission for this collection
  await requirePermission(user, 'collections', 'delete', name)

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const contentTable = isPostgres ? contentPostgres : contentSqlite

  // Check if content exists
  const existing = await db
    .select()
    .from(contentTable)
    .where(
      and(
        eq(contentTable.id, id),
        eq(contentTable.collection, name)
      )
    )
    .limit(1)

  if (existing.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not found'
    })
  }

  // Delete content (translations will be deleted by cascade)
  await db
    .delete(contentTable)
    .where(eq(contentTable.id, id))

  return {
    success: true
  }
})
