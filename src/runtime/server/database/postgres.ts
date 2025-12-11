import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null
let sql: ReturnType<typeof postgres> | null = null

/**
 * Initialize PostgreSQL database connection
 */
export async function initPostgresDatabase(connectionUrl: string) {
  if (db) return db

  // Create PostgreSQL connection
  sql = postgres(connectionUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  })

  // Create Drizzle instance
  db = drizzle(sql, {
    schema: {
      content: schema.contentPostgres,
      translations: schema.translationsPostgres,
      media: schema.mediaPostgres,
      users: schema.usersPostgres,
      roles: schema.rolesPostgres
    }
  })

  // Run migrations / create tables
  await createTables(sql)

  return db
}

/**
 * Get PostgreSQL database instance
 */
export function getPostgresDatabase() {
  if (!db) {
    throw new Error('[CMS] PostgreSQL database not initialized. Call initPostgresDatabase first.')
  }
  return db
}

/**
 * Close PostgreSQL database connection
 */
export async function closePostgresDatabase() {
  if (sql) {
    await sql.end()
    sql = null
    db = null
  }
}

/**
 * Create database tables if they don't exist
 */
async function createTables(client: ReturnType<typeof postgres>) {
  // Create cms_content table
  await client`
    CREATE TABLE IF NOT EXISTS cms_content (
      id VARCHAR(21) PRIMARY KEY,
      type VARCHAR(20) NOT NULL CHECK(type IN ('collection', 'singleton')),
      collection VARCHAR(100) NOT NULL,
      data JSONB NOT NULL DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      published_at TIMESTAMP,
      created_by VARCHAR(21)
    )
  `

  // Create indexes
  await client`
    CREATE INDEX IF NOT EXISTS idx_content_collection ON cms_content(collection)
  `

  await client`
    CREATE INDEX IF NOT EXISTS idx_content_type ON cms_content(type)
  `

  // Create cms_content_translations table
  await client`
    CREATE TABLE IF NOT EXISTS cms_content_translations (
      id VARCHAR(21) PRIMARY KEY,
      content_id VARCHAR(21) NOT NULL REFERENCES cms_content(id) ON DELETE CASCADE,
      locale VARCHAR(10) NOT NULL,
      data JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(content_id, locale)
    )
  `

  // Create cms_media table
  await client`
    CREATE TABLE IF NOT EXISTS cms_media (
      id VARCHAR(21) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size INTEGER NOT NULL,
      path VARCHAR(500) NOT NULL,
      url VARCHAR(500),
      width INTEGER,
      height INTEGER,
      alt VARCHAR(255),
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_by VARCHAR(21)
    )
  `

  // Create cms_roles table
  await client`
    CREATE TABLE IF NOT EXISTS cms_roles (
      id VARCHAR(21) PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100) NOT NULL,
      description TEXT,
      permissions JSONB NOT NULL DEFAULT '{}',
      is_system BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `

  // Create index on role name
  await client`
    CREATE INDEX IF NOT EXISTS idx_roles_name ON cms_roles(name)
  `

  // Create cms_users table
  await client`
    CREATE TABLE IF NOT EXISTS cms_users (
      id VARCHAR(21) PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      name VARCHAR(255),
      avatar VARCHAR(500),
      role VARCHAR(20) DEFAULT 'editor',
      role_id VARCHAR(21) REFERENCES cms_roles(id) ON DELETE SET NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      last_login TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `

  // Create index on username
  await client`
    CREATE INDEX IF NOT EXISTS idx_users_username ON cms_users(username)
  `

  // Create index on role_id
  await client`
    CREATE INDEX IF NOT EXISTS idx_users_role_id ON cms_users(role_id)
  `

  // Add role_id column if it doesn't exist (migration for existing databases)
  try {
    await client`ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS role_id VARCHAR(21) REFERENCES cms_roles(id) ON DELETE SET NULL`
  } catch {
    // Column might already exist
  }

  // Add avatar column if it doesn't exist (migration for existing databases)
  try {
    await client`ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500)`
  } catch {
    // Column might already exist
  }

  // Add locale column if it doesn't exist (migration for existing databases)
  try {
    await client`ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS locale VARCHAR(5) DEFAULT 'en'`
  } catch {
    // Column might already exist
  }
}

export type PostgresDatabase = ReturnType<typeof drizzle>
