import type { FieldDefinition, FieldsSchema } from './fields'

/**
 * Configuration for a singleton (single item like homepage, settings)
 */
export interface SingletonConfig {
  /** Display label in admin UI */
  label: string
  /** Icon name (Heroicons) */
  icon?: string
  /** Description shown in admin */
  description?: string
  /** Field definitions */
  fields: FieldsSchema
}

/**
 * Configuration for a collection (multiple items like posts, products)
 */
export interface CollectionConfig {
  /** Display label (singular) in admin UI */
  label: string
  /** Display label (plural) in admin UI */
  labelPlural?: string
  /** Icon name (Heroicons) */
  icon?: string
  /** Description shown in admin */
  description?: string
  /** Field used as the title in lists */
  titleField?: string
  /** Field used for URL slugs */
  slugField?: string
  /** Fields to display in list view (array of field names) */
  listFields?: string[]
  /** Field definitions */
  fields: FieldsSchema
  /** Enable timestamps (created_at, updated_at) - default: true */
  timestamps?: boolean
  /** Enable soft delete - default: false */
  softDelete?: boolean
  /** Enable draft/published status - default: true */
  publishable?: boolean
  /** Enable sorting - default: false */
  sortable?: boolean
  /** Default sort field */
  defaultSort?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

/**
 * Main CMS configuration
 */
export interface CmsConfig {
  /** Supported locales */
  locales: string[]
  /** Default locale */
  defaultLocale: string
  /** Singleton definitions */
  singletons?: Record<string, SingletonConfig>
  /** Collection definitions */
  collections?: Record<string, CollectionConfig>
}

/**
 * Module options for nuxt.config.ts
 */
export interface CmsModuleOptions {
  /** Database configuration */
  database: {
    /** Database provider */
    provider: 'sqlite' | 'postgresql'
    /** Connection URL (for PostgreSQL) */
    url?: string
    /** Database filename (for SQLite) */
    filename?: string
  }
  /** Admin panel configuration */
  admin: {
    /** Enable admin panel */
    enabled: boolean
    /** Admin panel path */
    path: string
    /** Admin credentials */
    credentials?: {
      username: string
      password: string
    }
  }
  /** Upload configuration */
  uploads?: {
    /** Upload directory path */
    path?: string
    /** Maximum file size in bytes */
    maxSize?: number
    /** Allowed MIME types */
    allowedTypes?: string[]
  }
}

/**
 * Resolved CMS configuration (after processing)
 */
export interface ResolvedCmsConfig extends CmsConfig {
  /** Whether i18n module is detected */
  i18nEnabled: boolean
}

/**
 * Define CMS configuration with type safety
 */
export function defineCmsConfig(config: CmsConfig): CmsConfig {
  // Validate configuration
  if (!config.locales || config.locales.length === 0) {
    throw new Error('[CMS] At least one locale must be defined')
  }

  if (!config.defaultLocale) {
    throw new Error('[CMS] Default locale must be defined')
  }

  if (!config.locales.includes(config.defaultLocale)) {
    throw new Error('[CMS] Default locale must be included in locales array')
  }

  // Validate collections
  if (config.collections) {
    for (const [name, collection] of Object.entries(config.collections)) {
      if (!collection.fields || Object.keys(collection.fields).length === 0) {
        throw new Error(`[CMS] Collection "${name}" must have at least one field`)
      }
    }
  }

  // Validate singletons
  if (config.singletons) {
    for (const [name, singleton] of Object.entries(config.singletons)) {
      if (!singleton.fields || Object.keys(singleton.fields).length === 0) {
        throw new Error(`[CMS] Singleton "${name}" must have at least one field`)
      }
    }
  }

  return config
}

/**
 * Type helper to infer field types from a collection
 */
export type InferCollectionFields<T extends CollectionConfig> = {
  [K in keyof T['fields']]: T['fields'][K] extends { type: infer U } ? U : never
}

/**
 * Type helper to infer content data from fields schema
 */
export type InferContentData<T extends FieldsSchema> = {
  [K in keyof T]: FieldValueType<T[K]>
}

/**
 * Map field definition to its runtime value type
 */
type FieldValueType<T extends FieldDefinition> =
  T extends { type: 'text' | 'textarea' | 'email' | 'url' | 'password' | 'richtext' | 'markdown' | 'code' | 'color' | 'slug' } ? string :
  T extends { type: 'number' } ? number :
  T extends { type: 'boolean' } ? boolean :
  T extends { type: 'select' | 'radio' } ? string | number :
  T extends { type: 'checkbox' | 'gallery' } ? (string | number)[] :
  T extends { type: 'image' | 'file' } ? string | null :
  T extends { type: 'date' | 'datetime' | 'time' } ? string :
  T extends { type: 'relation' } ? string | string[] | null :
  T extends { type: 'json' | 'group' } ? Record<string, unknown> :
  T extends { type: 'repeater' } ? Record<string, unknown>[] :
  unknown
