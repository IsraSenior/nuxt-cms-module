import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null
let sqliteDb: Database.Database | null = null

/**
 * Initialize SQLite database connection
 */
export function initSqliteDatabase(filename: string) {
  if (db) return db

  // Ensure directory exists
  const dir = dirname(filename)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  // Create SQLite connection
  sqliteDb = new Database(filename)

  // Enable WAL mode for better performance
  sqliteDb.pragma('journal_mode = WAL')

  // Create Drizzle instance
  db = drizzle(sqliteDb, {
    schema: {
      content: schema.contentSqlite,
      translations: schema.translationsSqlite,
      media: schema.mediaSqlite,
      users: schema.usersSqlite,
      roles: schema.rolesSqlite
    }
  })

  // Run migrations / create tables
  createTables(sqliteDb)

  return db
}

/**
 * Get SQLite database instance
 */
export function getSqliteDatabase() {
  if (!db) {
    throw new Error('[CMS] SQLite database not initialized. Call initSqliteDatabase first.')
  }
  return db
}

/**
 * Close SQLite database connection
 */
export function closeSqliteDatabase() {
  if (sqliteDb) {
    sqliteDb.close()
    sqliteDb = null
    db = null
  }
}

/**
 * Create database tables if they don't exist
 */
function createTables(sqlite: Database.Database) {
  // Create cms_content table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cms_content (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('collection', 'singleton')),
      collection TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      published_at INTEGER,
      created_by TEXT
    )
  `)

  // Create index on collection
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_content_collection ON cms_content(collection)
  `)

  // Create index on type
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_content_type ON cms_content(type)
  `)

  // Create cms_content_translations table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cms_content_translations (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (content_id) REFERENCES cms_content(id) ON DELETE CASCADE
    )
  `)

  // Create unique index on content_id + locale
  sqlite.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_content_locale
    ON cms_content_translations(content_id, locale)
  `)

  // Create cms_media table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cms_media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      url TEXT,
      width INTEGER,
      height INTEGER,
      alt TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      created_by TEXT
    )
  `)

  // Create cms_roles table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cms_roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      permissions TEXT NOT NULL DEFAULT '{}',
      is_system INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // Create index on role name
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_roles_name ON cms_roles(name)
  `)

  // Create cms_users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cms_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT,
      name TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'editor',
      role_id TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      last_login INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (role_id) REFERENCES cms_roles(id) ON DELETE SET NULL
    )
  `)

  // Create index on username
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON cms_users(username)
  `)

  // Add role_id column if it doesn't exist (migration for existing databases)
  try {
    sqlite.exec(`ALTER TABLE cms_users ADD COLUMN role_id TEXT`)
  } catch {
    // Column already exists, ignore
  }

  // Add avatar column if it doesn't exist (migration for existing databases)
  try {
    sqlite.exec(`ALTER TABLE cms_users ADD COLUMN avatar TEXT`)
  } catch {
    // Column already exists, ignore
  }

  // Add locale column if it doesn't exist (migration for existing databases)
  try {
    sqlite.exec(`ALTER TABLE cms_users ADD COLUMN locale TEXT DEFAULT 'en'`)
  } catch {
    // Column already exists, ignore
  }

  // Create index on role_id (must be after column exists)
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_role_id ON cms_users(role_id)
  `)
}

export type SqliteDatabase = ReturnType<typeof drizzle>
