import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireAuth } from '../../../../../utils/auth'
import { requirePermission } from '../../../../../utils/permissions'
import { processContentData } from '../../../../../utils/validation'
import { useCmsDatabase, contentSqlite, contentPostgres, translationsSqlite, translationsPostgres, getDatabaseType } from '../../../../../database/client'

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

  // Check update permission for this collection
  await requirePermission(user, 'collections', 'update', name)

  const body = await readBody(event)
  const { data, translations, status } = body

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const contentTable = isPostgres ? contentPostgres : contentSqlite
  const translationsTable = isPostgres ? translationsPostgres : translationsSqlite

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

  const now = new Date()
  const updateData: Record<string, unknown> = {
    updatedAt: now
  }

  if (data) {
    updateData.data = processContentData(data, {})
  }

  if (status) {
    updateData.status = status
    if (status === 'published' && !existing[0].publishedAt) {
      updateData.publishedAt = now
    }
  }

  // Update content
  await db
    .update(contentTable)
    .set(updateData)
    .where(eq(contentTable.id, id))

  // Update translations
  if (translations && typeof translations === 'object') {
    for (const [locale, localeData] of Object.entries(translations)) {
      if (localeData && typeof localeData === 'object') {
        // Check if translation exists
        const existingTranslation = await db
          .select()
          .from(translationsTable)
          .where(
            and(
              eq(translationsTable.contentId, id),
              eq(translationsTable.locale, locale)
            )
          )
          .limit(1)

        if (existingTranslation.length > 0) {
          // Update existing translation
          await db
            .update(translationsTable)
            .set({
              data: processContentData(localeData as Record<string, unknown>, {}),
              updatedAt: now
            })
            .where(eq(translationsTable.id, existingTranslation[0].id))
        } else {
          // Insert new translation
          await db.insert(translationsTable).values({
            id: nanoid(),
            contentId: id,
            locale,
            data: processContentData(localeData as Record<string, unknown>, {}),
            createdAt: now,
            updatedAt: now
          })
        }
      }
    }
  }

  return {
    success: true
  }
})
