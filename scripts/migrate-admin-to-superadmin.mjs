#!/usr/bin/env node

/**
 * Migration script to upgrade an admin user to super_admin role
 *
 * Usage:
 *   node scripts/migrate-admin-to-superadmin.mjs [username]
 *
 * If username is not provided, will migrate the first admin user found.
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get username from command line args
const targetUsername = process.argv[2]

// Try to find the SQLite database
const possiblePaths = [
  join(process.cwd(), '.cms', 'cms.db'),
  join(process.cwd(), '.nuxt', '.cms', 'cms.db'),
  join(process.cwd(), 'server', '.cms', 'cms.db'),
  join(process.cwd(), '.output', '.cms', 'cms.db'),
  join(process.cwd(), 'cms.db'),
  join(__dirname, '..', '.cms', 'cms.db'),
  join(__dirname, '..', 'playground', '.cms', 'cms.db')
]

let dbPath = possiblePaths.find(path => existsSync(path))

if (!dbPath) {
  console.error('❌ Could not find SQLite database file')
  console.error('   Searched in:')
  possiblePaths.forEach(path => console.error(`   - ${path}`))
  console.error('\n   Please provide the database path as an environment variable:')
  console.error('   DB_PATH=/path/to/cms.db node scripts/migrate-admin-to-superadmin.mjs')
  process.exit(1)
}

if (process.env.DB_PATH) {
  dbPath = process.env.DB_PATH
}

console.log(`📊 Using database: ${dbPath}\n`)

try {
  const db = new Database(dbPath)

  // Find or create super_admin role
  let superAdminRole = db.prepare('SELECT * FROM cms_roles WHERE name = ?').get('super_admin')

  if (!superAdminRole) {
    console.log('🔧 Creating super_admin role...')
    const now = new Date().toISOString()
    const roleId = generateId()

    db.prepare(`
      INSERT INTO cms_roles (id, name, display_name, description, permissions, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      roleId,
      'super_admin',
      'Super Administrator',
      'Full system access with all permissions',
      JSON.stringify({
        content: { create: true, read: true, update: true, delete: true },
        media: { create: true, read: true, update: true, delete: true },
        users: { create: true, read: true, update: true, delete: true },
        roles: { create: true, read: true, update: true, delete: true },
        settings: { read: true, update: true }
      }),
      1, // is_system = true
      now,
      now
    )

    superAdminRole = db.prepare('SELECT * FROM cms_roles WHERE name = ?').get('super_admin')
    console.log('✅ Super admin role created\n')
  }

  // Find user to upgrade
  let user
  if (targetUsername) {
    user = db.prepare('SELECT * FROM cms_users WHERE username = ?').get(targetUsername)
    if (!user) {
      console.error(`❌ User "${targetUsername}" not found`)
      process.exit(1)
    }
  } else {
    // Find first admin user
    user = db.prepare('SELECT * FROM cms_users WHERE role = ?').get('admin')
    if (!user) {
      console.error('❌ No admin users found in database')
      process.exit(1)
    }
  }

  console.log(`👤 Found user: ${user.username}`)
  console.log(`   Current role: ${user.role}`)
  console.log(`   Current role_id: ${user.role_id || 'null'}\n`)

  // Update user
  db.prepare('UPDATE cms_users SET role_id = ?, updated_at = ? WHERE id = ?')
    .run(superAdminRole.id, new Date().toISOString(), user.id)

  console.log('✅ User upgraded to super_admin!')
  console.log(`   Username: ${user.username}`)
  console.log(`   New role_id: ${superAdminRole.id}`)
  console.log(`   Role: ${superAdminRole.display_name}`)

  db.close()
} catch (error) {
  console.error('❌ Migration failed:', error.message)
  process.exit(1)
}

// Simple ID generator (matching nanoid behavior)
function generateId() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let id = ''
  for (let i = 0; i < 21; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}
