import { defineEventHandler, useRuntimeConfig, getRouterParam, createError } from '#imports'
import { eq } from 'drizzle-orm'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, mediaSqlite, mediaPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check delete permission for media
  await requirePermission(user, 'media', 'delete')

  const config = useRuntimeConfig()

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Media ID is required'
    })
  }

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const mediaTable = isPostgres ? mediaPostgres : mediaSqlite

  // Get media item
  const items = await db
    .select()
    .from(mediaTable)
    .where(eq(mediaTable.id, id))
    .limit(1)

  if (items.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Media not found'
    })
  }

  const media = items[0]

  // Delete file from disk
  const filePath = join(config.cms.uploads.path, media.path)
  if (existsSync(filePath)) {
    try {
      await unlink(filePath)
    } catch (error) {
      console.error('[CMS] Failed to delete file:', error)
    }
  }

  // Delete from database
  await db.delete(mediaTable).where(eq(mediaTable.id, id))

  return {
    success: true
  }
})
