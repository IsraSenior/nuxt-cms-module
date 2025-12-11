import { defineEventHandler, readBody, createError } from '#imports'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'
import type { RolePermissions } from '../../../database/schema/roles'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check manage permission for roles (only super_admin has this)
  await requirePermission(user, 'roles', 'manage')

  const body = await readBody(event)
  const { name, displayName, description, permissions } = body

  // Validate required fields
  if (!name || !displayName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and display name are required'
    })
  }

  // Validate name format (lowercase, no spaces)
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Role name must start with a letter and contain only lowercase letters, numbers, and underscores'
    })
  }

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite

  // Check if name already exists
  const existingRole = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.name, name))
    .limit(1)

  if (existingRole.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Role name already exists'
    })
  }

  const now = new Date()
  const roleId = nanoid()

  // Default permissions if not provided
  const defaultPermissions: RolePermissions = {
    collections: { '*': ['read'] },
    singletons: { '*': ['read'] },
    media: ['read'],
    users: [],
    roles: [],
    settings: []
  }

  // Create role
  await db.insert(rolesTable).values({
    id: roleId,
    name,
    displayName,
    description: description || null,
    permissions: permissions || defaultPermissions,
    isSystem: false,
    createdAt: now,
    updatedAt: now
  })

  return {
    success: true,
    id: roleId
  }
})
