import { defineEventHandler, useRuntimeConfig, readMultipartFormData, createError } from '#imports'
import { nanoid } from 'nanoid'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname, basename } from 'path'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, mediaSqlite, mediaPostgres, getDatabaseType } from '../../../database/client'
import { sanitizeText } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check create permission for media
  await requirePermission(user, 'media', 'create')

  const config = useRuntimeConfig()

  // Get multipart form data
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file uploaded'
    })
  }

  const fileData = formData.find(f => f.name === 'file')
  const altData = formData.find(f => f.name === 'alt')

  if (!fileData || !fileData.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file uploaded'
    })
  }

  const mimeType = fileData.type || 'application/octet-stream'
  // Sanitize filename: remove path components to prevent directory traversal
  const rawFilename = fileData.filename || 'file'
  const originalName = basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '_')
  const size = fileData.data.length
  // Sanitize alt text to prevent XSS
  const rawAlt = altData?.data?.toString()
  const alt = rawAlt ? sanitizeText(rawAlt) : null

  // Validate mime type
  const allowedTypes = config.cms.uploads.allowedTypes
  const isAllowed = allowedTypes.some((type: string) => {
    if (type.endsWith('/*')) {
      return mimeType.startsWith(type.slice(0, -1))
    }
    return mimeType === type
  })

  if (!isAllowed) {
    throw createError({
      statusCode: 400,
      statusMessage: `File type ${mimeType} is not allowed`
    })
  }

  // Validate file size
  if (size > config.cms.uploads.maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: `File size exceeds maximum of ${config.cms.uploads.maxSize} bytes`
    })
  }

  // Generate unique filename
  const id = nanoid()
  const ext = extname(originalName) || ''
  const filename = `${id}${ext}`

  // Ensure upload directory exists
  const uploadPath = config.cms.uploads.path
  if (!existsSync(uploadPath)) {
    await mkdir(uploadPath, { recursive: true })
  }

  // Write file
  const filePath = join(uploadPath, filename)
  await writeFile(filePath, fileData.data)

  // Get image dimensions if applicable
  let width: number | null = null
  let height: number | null = null

  if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
    try {
      // Simple dimension extraction from common formats
      // For more robust handling, consider using sharp or similar
      const dimensions = getImageDimensions(fileData.data, mimeType)
      if (dimensions) {
        width = dimensions.width
        height = dimensions.height
      }
    } catch {
      // Ignore dimension extraction errors
    }
  }

  // Save to database
  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const mediaTable = isPostgres ? mediaPostgres : mediaSqlite

  const now = new Date()
  const relativePath = filename

  await db.insert(mediaTable).values({
    id,
    filename,
    originalName,
    mimeType,
    size,
    path: relativePath,
    url: `/api/cms/media/file/${filename}`,
    width,
    height,
    alt,
    metadata: null,
    createdAt: now,
    createdBy: user.id
  })

  return {
    success: true,
    id,
    filename,
    url: `/api/cms/media/file/${filename}`,
    mimeType,
    size,
    width,
    height
  }
})

/**
 * Basic image dimension extraction
 */
function getImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === 'image/png') {
      // PNG: width at offset 16, height at offset 20 (big endian)
      if (buffer.length > 24) {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20)
        }
      }
    } else if (mimeType === 'image/jpeg') {
      // JPEG: Search for SOF marker
      let offset = 2
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break
        const marker = buffer[offset + 1]
        // SOF markers: 0xC0-0xC3, 0xC5-0xC7, 0xC9-0xCB, 0xCD-0xCF
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xcf && marker !== 0xc8)) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7)
          }
        }
        offset += 2 + buffer.readUInt16BE(offset + 2)
      }
    } else if (mimeType === 'image/gif') {
      // GIF: width at offset 6, height at offset 8 (little endian)
      if (buffer.length > 10) {
        return {
          width: buffer.readUInt16LE(6),
          height: buffer.readUInt16LE(8)
        }
      }
    } else if (mimeType === 'image/webp') {
      // WebP: Check VP8 chunk
      if (buffer.length > 30 && buffer.toString('utf8', 0, 4) === 'RIFF') {
        const format = buffer.toString('utf8', 12, 16)
        if (format === 'VP8 ') {
          // Lossy
          return {
            width: buffer.readUInt16LE(26) & 0x3fff,
            height: buffer.readUInt16LE(28) & 0x3fff
          }
        } else if (format === 'VP8L') {
          // Lossless
          const bits = buffer.readUInt32LE(21)
          return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >> 14) & 0x3fff) + 1
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return null
}
