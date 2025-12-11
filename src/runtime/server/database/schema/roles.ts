import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { pgTable, varchar, timestamp, boolean, json } from 'drizzle-orm/pg-core'

/**
 * SQLite schema for CMS roles
 */
export const rolesSqlite = sqliteTable('cms_roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  permissions: text('permissions', { mode: 'json' }).$type<RolePermissions>().notNull(),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

/**
 * PostgreSQL schema for CMS roles
 */
export const rolesPostgres = pgTable('cms_roles', {
  id: varchar('id', { length: 21 }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  permissions: json('permissions').$type<RolePermissions>().notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

/**
 * Permission actions
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'manage'

/**
 * Permission resource types
 */
export type PermissionResource = 'collections' | 'singletons' | 'media' | 'users' | 'roles' | 'settings'

/**
 * Resource-specific permissions
 * Key is resource name (e.g., 'posts', 'products') or '*' for all
 */
export interface ResourcePermissions {
  [resourceName: string]: PermissionAction[]
}

/**
 * Full role permissions structure
 */
export interface RolePermissions {
  collections?: ResourcePermissions  // { '*': ['read'], 'posts': ['create', 'read', 'update'] }
  singletons?: ResourcePermissions   // { '*': ['read', 'update'] }
  media?: PermissionAction[]         // ['create', 'read', 'delete']
  users?: PermissionAction[]         // ['read', 'create', 'update', 'delete']
  roles?: PermissionAction[]         // ['read', 'manage']
  settings?: PermissionAction[]      // ['read', 'update']
}

/**
 * Default system roles
 */
export const DEFAULT_ROLES = {
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full access to all CMS features',
    isSystem: true,
    permissions: {
      collections: { '*': ['create', 'read', 'update', 'delete', 'publish', 'manage'] },
      singletons: { '*': ['read', 'update', 'publish', 'manage'] },
      media: ['create', 'read', 'update', 'delete', 'manage'],
      users: ['create', 'read', 'update', 'delete', 'manage'],
      roles: ['create', 'read', 'update', 'delete', 'manage'],
      settings: ['read', 'update', 'manage']
    } as RolePermissions
  },
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Manage content and users',
    isSystem: true,
    permissions: {
      collections: { '*': ['create', 'read', 'update', 'delete', 'publish'] },
      singletons: { '*': ['read', 'update', 'publish'] },
      media: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update'],
      roles: ['read'],
      settings: ['read']
    } as RolePermissions
  },
  editor: {
    name: 'editor',
    displayName: 'Editor',
    description: 'Create and edit content',
    isSystem: true,
    permissions: {
      collections: { '*': ['create', 'read', 'update', 'publish'] },
      singletons: { '*': ['read', 'update'] },
      media: ['create', 'read', 'update'],
      users: [],
      roles: [],
      settings: ['read']
    } as RolePermissions
  },
  author: {
    name: 'author',
    displayName: 'Author',
    description: 'Create and edit own content',
    isSystem: true,
    permissions: {
      collections: { '*': ['create', 'read', 'update'] },
      singletons: { '*': ['read'] },
      media: ['create', 'read'],
      users: [],
      roles: [],
      settings: []
    } as RolePermissions
  },
  viewer: {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to content',
    isSystem: true,
    permissions: {
      collections: { '*': ['read'] },
      singletons: { '*': ['read'] },
      media: ['read'],
      users: [],
      roles: [],
      settings: []
    } as RolePermissions
  }
} as const

export type RoleSqlite = typeof rolesSqlite.$inferSelect
export type RolePostgres = typeof rolesPostgres.$inferSelect
export type NewRoleSqlite = typeof rolesSqlite.$inferInsert
export type NewRolePostgres = typeof rolesPostgres.$inferInsert
