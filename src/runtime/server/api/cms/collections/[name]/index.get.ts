import { defineEventHandler, getRouterParam, getQuery, createError } from '#imports'
import { eq, desc, asc, like, and, sql } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/auth'
import { querySchema } from '../../../../utils/validation'
import { useCmsDatabase, contentSqlite, contentPostgres, translationsSqlite, translationsPostgres, getDatabaseType } from '../../../../database/client'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collection name is required'
    })
  }

  // Parse query params
  const query = getQuery(event)
  const params = querySchema.parse(query)

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const contentTable = isPostgres ? contentPostgres : contentSqlite
  const translationsTable = isPostgres ? translationsPostgres : translationsSqlite

  // Build where conditions
  const conditions = [
    eq(contentTable.collection, name),
    eq(contentTable.type, 'collection')
  ]

  if (params.status) {
    conditions.push(eq(contentTable.status, params.status))
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contentTable)
    .where(and(...conditions))

  const total = Number(countResult[0]?.count || 0)

  // Calculate pagination
  const offset = (params.page - 1) * params.perPage
  const totalPages = Math.ceil(total / params.perPage)

  // Get items
  let items = await db
    .select()
    .from(contentTable)
    .where(and(...conditions))
    .orderBy(params.orderDir === 'asc' ? asc(contentTable.createdAt) : desc(contentTable.createdAt))
    .limit(params.perPage)
    .offset(offset)

  // Always get translations to merge with items (use default locale if not specified)
  const contentIds = items.map(item => item.id)

  if (contentIds.length > 0) {
    // Get all translations for these items
    const allTranslations = await db
      .select()
      .from(translationsTable)
      .where(sql`${translationsTable.contentId} IN (${sql.join(contentIds.map(id => sql`${id}`), sql`, `)})`)

    // Group translations by content ID
    const translationsByContent = new Map<string, Map<string, Record<string, unknown>>>()
    for (const t of allTranslations) {
      if (!translationsByContent.has(t.contentId)) {
        translationsByContent.set(t.contentId, new Map())
      }
      translationsByContent.get(t.contentId)!.set(t.locale, t.data as Record<string, unknown>)
    }

    // Merge translations with items
    // Priority: specified locale > first available translation
    items = items.map(item => {
      const itemTranslations = translationsByContent.get(item.id)
      if (!itemTranslations || itemTranslations.size === 0) {
        return item
      }

      // Get the translation to use (specified locale or first available)
      let translationData: Record<string, unknown> | undefined
      if (params.locale && itemTranslations.has(params.locale)) {
        translationData = itemTranslations.get(params.locale)
      } else {
        // Use first available translation (typically the default locale)
        translationData = itemTranslations.values().next().value
      }

      return {
        ...item,
        data: {
          ...(item.data as Record<string, unknown>),
          ...translationData
        }
      }
    })
  }

  return {
    data: items,
    meta: {
      total,
      page: params.page,
      perPage: params.perPage,
      totalPages
    }
  }
})
