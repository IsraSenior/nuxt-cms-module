import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { requirePermission } from '../../../utils/permissions'
import { useCmsDatabase, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Check manage permission for roles
  await requirePermission(user, 'roles', 'manage')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Role ID is required'
    })
  }

  const body = await readBody(event)
  const { displayName, description, permissions } = body

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite

  // Check if role exists
  const existingRoles = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.id, id))
    .limit(1)

  if (existingRoles.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Role not found'
    })
  }

  const existingRole = existingRoles[0]

  // Prevent editing system role name
  if (existingRole.isSystem && body.name && body.name !== existingRole.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot change the name of a system role'
    })
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (displayName !== undefined) {
    updateData.displayName = displayName
  }

  if (description !== undefined) {
    updateData.description = description
  }

  if (permissions !== undefined) {
    // Validate permissions structure
    if (typeof permissions !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Permissions must be an object'
      })
    }
    updateData.permissions = permissions
  }

  // Update role
  await db
    .update(rolesTable)
    .set(updateData)
    .where(eq(rolesTable.id, id))

  return {
    success: true
  }
})
