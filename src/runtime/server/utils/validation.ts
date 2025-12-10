import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import slugifyLib from 'slugify'
import type { FieldDefinition, FieldsSchema } from '../../types'

/**
 * Create Zod schema from field definition
 */
export function createFieldSchema(field: FieldDefinition): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'url':
    case 'password':
    case 'markdown':
    case 'code':
    case 'color':
    case 'slug':
      schema = z.string()
      if (field.type === 'email') schema = z.string().email()
      if (field.type === 'url') schema = z.string().url()
      if ('minLength' in field && field.minLength) schema = (schema as z.ZodString).min(field.minLength)
      if ('maxLength' in field && field.maxLength) schema = (schema as z.ZodString).max(field.maxLength)
      break

    case 'richtext':
      schema = z.string()
      break

    case 'number':
      schema = z.number()
      if ('min' in field && field.min !== undefined) schema = (schema as z.ZodNumber).min(field.min)
      if ('max' in field && field.max !== undefined) schema = (schema as z.ZodNumber).max(field.max)
      break

    case 'boolean':
      schema = z.boolean()
      break

    case 'select':
    case 'radio':
      const options = field.options.map(o => o.value)
      if ('multiple' in field && field.multiple) {
        schema = z.array(z.union(options.map(v => z.literal(v)) as [z.ZodLiteral<any>, z.ZodLiteral<any>, ...z.ZodLiteral<any>[]]))
      } else {
        schema = z.union(options.map(v => z.literal(v)) as [z.ZodLiteral<any>, z.ZodLiteral<any>, ...z.ZodLiteral<any>[]])
      }
      break

    case 'checkbox':
      const checkboxOptions = field.options.map(o => o.value)
      schema = z.array(z.union(checkboxOptions.map(v => z.literal(v)) as [z.ZodLiteral<any>, z.ZodLiteral<any>, ...z.ZodLiteral<any>[]]))
      break

    case 'image':
    case 'file':
      schema = z.string().nullable()
      break

    case 'gallery':
      schema = z.array(z.string())
      break

    case 'date':
    case 'datetime':
    case 'time':
      schema = z.string()
      break

    case 'relation':
      if (field.relationship === 'many-to-many' || field.relationship === 'one-to-many') {
        schema = z.array(z.string())
      } else {
        schema = z.string().nullable()
      }
      break

    case 'json':
      schema = z.record(z.unknown())
      break

    case 'repeater':
      const repeaterItemSchema = z.object(
        Object.entries(field.fields).reduce((acc, [key, subField]) => {
          acc[key] = createFieldSchema(subField)
          return acc
        }, {} as Record<string, z.ZodTypeAny>)
      )
      schema = z.array(repeaterItemSchema)
      if ('min' in field && field.min) schema = (schema as z.ZodArray<any>).min(field.min)
      if ('max' in field && field.max) schema = (schema as z.ZodArray<any>).max(field.max)
      break

    case 'group':
      schema = z.object(
        Object.entries(field.fields).reduce((acc, [key, subField]) => {
          acc[key] = createFieldSchema(subField)
          return acc
        }, {} as Record<string, z.ZodTypeAny>)
      )
      break

    default:
      schema = z.unknown()
  }

  // Make optional if not required
  if (!field.required) {
    schema = schema.optional().nullable()
  }

  return schema
}

/**
 * Create validation schema from fields schema
 */
export function createContentSchema(fields: FieldsSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [key, field] of Object.entries(fields)) {
    shape[key] = createFieldSchema(field)
  }

  return z.object(shape).passthrough()
}

/**
 * Validate content data against fields schema
 */
export function validateContentData(
  data: Record<string, unknown>,
  fields: FieldsSchema
): { success: boolean; data?: Record<string, unknown>; errors?: z.ZodError } {
  const schema = createContentSchema(fields)
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: result.error }
}

/**
 * Sanitize HTML content (for richtext fields)
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'code', 'img', 'hr', 'table', 'thead',
      'tbody', 'tr', 'th', 'td', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'style'],
    // Prevent XSS through javascript: URLs
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input']
  })
}

/**
 * Sanitize plain text (remove HTML, prevent injection)
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return ''

  // Remove HTML tags
  const withoutHtml = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })

  // Trim whitespace
  return withoutHtml.trim()
}

/**
 * Sanitize string for SQL-like patterns (prevent wildcards abuse)
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return ''

  // Remove special SQL characters that could be abused
  return query
    .replace(/[%_\\]/g, '')
    .trim()
    .slice(0, 100) // Limit length
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null

  try {
    const parsed = new URL(url)

    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') return null

  const trimmed = email.trim().toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return null
  }

  return trimmed
}

/**
 * Generate slug from text
 */
export function slugify(text: string, separator: '-' | '_' = '-'): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    replacement: separator
  })
}

/**
 * Process content data (sanitize, transform)
 */
export function processContentData(
  data: Record<string, unknown>,
  fields: FieldsSchema
): Record<string, unknown> {
  const processed: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    const field = fields[key]

    if (!field) {
      processed[key] = value
      continue
    }

    switch (field.type) {
      case 'richtext':
        processed[key] = typeof value === 'string' ? sanitizeHtml(value) : value
        break

      case 'slug':
        if (value) {
          processed[key] = slugify(String(value), field.separator)
        } else if (field.from && data[field.from]) {
          processed[key] = slugify(String(data[field.from]), field.separator)
        } else {
          processed[key] = value
        }
        break

      case 'repeater':
        if (Array.isArray(value)) {
          processed[key] = value.map(item =>
            processContentData(item as Record<string, unknown>, field.fields)
          )
        } else {
          processed[key] = value
        }
        break

      case 'group':
        if (value && typeof value === 'object') {
          processed[key] = processContentData(value as Record<string, unknown>, field.fields)
        } else {
          processed[key] = value
        }
        break

      default:
        processed[key] = value
    }
  }

  return processed
}

/**
 * Login request schema
 */
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

/**
 * Content query schema
 */
export const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  locale: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).default('desc')
})
