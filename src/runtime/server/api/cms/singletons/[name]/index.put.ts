import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireAuth } from '../../../../utils/auth'
import { requirePermission } from '../../../../utils/permissions'
import { processContentData } from '../../../../utils/validation'
import { useCmsDatabase, contentSqlite, contentPostgres, translationsSqlite, translationsPostgres, getDatabaseType } from '../../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Singleton name is required'
    })
  }

  // Check update permission for this singleton
  await requirePermission(user, 'singletons', 'update', name)

  const body = await readBody(event)
  const { data, translations } = body

  if (!data || typeof data !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data is required'
    })
  }

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const contentTable = isPostgres ? contentPostgres : contentSqlite
  const translationsTable = isPostgres ? translationsPostgres : translationsSqlite

  const now = new Date()

  // Check if singleton already exists
  const existing = await db
    .select()
    .from(contentTable)
    .where(
      and(
        eq(contentTable.collection, name),
        eq(contentTable.type, 'singleton')
      )
    )
    .limit(1)

  let contentId: string

  if (existing.length > 0) {
    contentId = existing[0].id

    // Update existing singleton
    await db
      .update(contentTable)
      .set({
        data: processContentData(data, {}),
        updatedAt: now
      })
      .where(eq(contentTable.id, contentId))
  } else {
    // Create new singleton
    contentId = nanoid()

    await db.insert(contentTable).values({
      id: contentId,
      type: 'singleton',
      collection: name,
      data: processContentData(data, {}),
      status: 'published',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      createdBy: user.id
    })
  }

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
              eq(translationsTable.contentId, contentId),
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
            contentId,
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
    success: true,
    id: contentId
  }
})
