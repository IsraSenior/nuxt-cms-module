import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
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
      statusMessage: 'Collection name is required'
    })
  }

  // Check create permission for this collection
  await requirePermission(user, 'collections', 'create', name)

  const body = await readBody(event)
  const { data, translations, status = 'draft' } = body

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
  const contentId = nanoid()

  // Insert content
  await db.insert(contentTable).values({
    id: contentId,
    type: 'collection',
    collection: name,
    data: processContentData(data, {}), // TODO: Get fields from config
    status,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === 'published' ? now : null,
    createdBy: user.id
  })

  // Insert translations
  if (translations && typeof translations === 'object') {
    for (const [locale, localeData] of Object.entries(translations)) {
      if (localeData && typeof localeData === 'object') {
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

  return {
    success: true,
    id: contentId
  }
})
