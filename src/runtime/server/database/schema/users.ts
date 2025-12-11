import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { pgTable, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'

/**
 * SQLite schema for CMS users
 */
export const usersSqlite = sqliteTable('cms_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: text('email'),
  name: text('name'),
  avatar: text('avatar'),
  // Legacy role field for backwards compatibility during migration
  role: text('role', { enum: ['admin', 'editor'] }).default('editor'),
  // New role system - references cms_roles.id
  roleId: text('role_id'),
  active: integer('active', { mode: 'boolean' }).default(true).notNull(),
  lastLogin: integer('last_login', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

/**
 * PostgreSQL schema for CMS users
 */
export const usersPostgres = pgTable('cms_users', {
  id: varchar('id', { length: 21 }).primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  avatar: varchar('avatar', { length: 500 }),
  // Legacy role field for backwards compatibility during migration
  role: varchar('role', { length: 20 }).default('editor'),
  // New role system - references cms_roles.id
  roleId: varchar('role_id', { length: 21 }),
  active: boolean('active').default(true).notNull(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export type UserSqlite = typeof usersSqlite.$inferSelect
export type UserPostgres = typeof usersPostgres.$inferSelect
export type NewUserSqlite = typeof usersSqlite.$inferInsert
export type NewUserPostgres = typeof usersPostgres.$inferInsert
