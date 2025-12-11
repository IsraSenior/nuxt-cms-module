import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'
import { useCmsDatabase, rolesSqlite, rolesPostgres, getDatabaseType } from '../database/client'
import { DEFAULT_ROLES } from '../database/schema/roles'

/**
 * Seed default roles if they don't exist
 */
export async function seedDefaultRoles(): Promise<void> {
  const db = useCmsDatabase()
  const rolesTable = getDatabaseType() === 'postgresql' ? rolesPostgres : rolesSqlite

  const now = new Date()

  for (const [key, roleData] of Object.entries(DEFAULT_ROLES)) {
    // Check if role already exists
    const existing = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.name, roleData.name))
      .limit(1)

    if (existing.length > 0) {
      // Update permissions if role exists (in case defaults changed)
      if (existing[0].isSystem) {
        await db
          .update(rolesTable)
          .set({
            permissions: roleData.permissions,
            displayName: roleData.displayName,
            description: roleData.description,
            updatedAt: now
          })
          .where(eq(rolesTable.id, existing[0].id))
      }
      continue
    }

    // Create role
    await db.insert(rolesTable).values({
      id: nanoid(),
      name: roleData.name,
      displayName: roleData.displayName,
      description: roleData.description,
      permissions: roleData.permissions,
      isSystem: roleData.isSystem,
      createdAt: now,
      updatedAt: now
    })

    console.log(`[CMS] Created default role: ${roleData.displayName}`)
  }
}

/**
 * Get role ID by name
 */
export async function getRoleIdByName(name: string): Promise<string | null> {
  const db = useCmsDatabase()
  const rolesTable = getDatabaseType() === 'postgresql' ? rolesPostgres : rolesSqlite

  const roles = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.name, name))
    .limit(1)

  return roles.length > 0 ? roles[0].id : null
}

/**
 * Migrate legacy users to new role system
 */
export async function migrateLegacyUsers(): Promise<void> {
  const { usersSqlite, usersPostgres } = await import('../database/client')

  const db = useCmsDatabase()
  const usersTable = getDatabaseType() === 'postgresql' ? usersPostgres : usersSqlite
  const rolesTable = getDatabaseType() === 'postgresql' ? rolesPostgres : rolesSqlite

  // Get all users without roleId
  const users = await db
    .select()
    .from(usersTable)

  // Get role IDs
  const adminRoleId = await getRoleIdByName('admin')
  const editorRoleId = await getRoleIdByName('editor')

  if (!adminRoleId || !editorRoleId) {
    console.warn('[CMS] Cannot migrate users: default roles not found')
    return
  }

  for (const user of users) {
    // Skip if already has roleId
    if (user.roleId) continue

    // Map legacy role to new roleId
    const newRoleId = user.role === 'admin' ? adminRoleId : editorRoleId

    await db
      .update(usersTable)
      .set({ roleId: newRoleId })
      .where(eq(usersTable.id, user.id))

    console.log(`[CMS] Migrated user ${user.username} to role system`)
  }
}
