import { createError, H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { useCmsDatabase, rolesSqlite, rolesPostgres, getDatabaseType } from '../database/client'
import type { RolePermissions, PermissionAction, PermissionResource, ResourcePermissions } from '../database/schema/roles'
import type { SafeCmsUser } from '../../types'

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
}

/**
 * Get role permissions from database
 */
export async function getRolePermissions(roleId: string): Promise<RolePermissions | null> {
  const db = useCmsDatabase()
  const rolesTable = getDatabaseType() === 'postgresql' ? rolesPostgres : rolesSqlite

  const roles = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.id, roleId))
    .limit(1)

  if (roles.length === 0) {
    return null
  }

  return roles[0].permissions as RolePermissions
}

/**
 * Get role by name
 */
export async function getRoleByName(name: string) {
  const db = useCmsDatabase()
  const rolesTable = getDatabaseType() === 'postgresql' ? rolesPostgres : rolesSqlite

  const roles = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.name, name))
    .limit(1)

  return roles[0] || null
}

/**
 * Check if user has permission for a specific action on a resource
 */
export async function checkPermission(
  user: SafeCmsUser,
  resource: PermissionResource,
  action: PermissionAction,
  resourceName?: string
): Promise<PermissionCheckResult> {
  // If no roleId, fall back to legacy role field
  if (!user.roleId) {
    return checkLegacyPermission(user, resource, action)
  }

  const permissions = await getRolePermissions(user.roleId)

  if (!permissions) {
    return { allowed: false, reason: 'Role not found' }
  }

  // Check resource-level permissions (collections, singletons)
  if (resource === 'collections' || resource === 'singletons') {
    const resourcePerms = permissions[resource] as ResourcePermissions | undefined

    if (!resourcePerms) {
      return { allowed: false, reason: `No ${resource} permissions` }
    }

    // Check specific resource first, then wildcard
    const specificPerms = resourceName ? resourcePerms[resourceName] : undefined
    const wildcardPerms = resourcePerms['*']

    if (specificPerms && specificPerms.includes(action)) {
      return { allowed: true }
    }

    if (wildcardPerms && wildcardPerms.includes(action)) {
      return { allowed: true }
    }

    return { allowed: false, reason: `Missing '${action}' permission for ${resource}${resourceName ? `/${resourceName}` : ''}` }
  }

  // Check simple permissions (media, users, roles, settings)
  const simplePerms = permissions[resource] as PermissionAction[] | undefined

  if (!simplePerms || !simplePerms.includes(action)) {
    return { allowed: false, reason: `Missing '${action}' permission for ${resource}` }
  }

  return { allowed: true }
}

/**
 * Legacy permission check for users without roleId
 */
function checkLegacyPermission(
  user: SafeCmsUser,
  resource: PermissionResource,
  action: PermissionAction
): PermissionCheckResult {
  const role = user.role || 'editor'

  // Admin has most permissions
  if (role === 'admin') {
    // Admins can do everything except manage roles
    if (resource === 'roles' && action === 'manage') {
      return { allowed: false, reason: 'Only super_admin can manage roles' }
    }
    return { allowed: true }
  }

  // Editor permissions
  if (role === 'editor') {
    // Editors can manage content
    if (resource === 'collections' || resource === 'singletons') {
      if (['create', 'read', 'update', 'publish'].includes(action)) {
        return { allowed: true }
      }
    }

    // Editors can manage media
    if (resource === 'media') {
      if (['create', 'read', 'update'].includes(action)) {
        return { allowed: true }
      }
    }

    // Editors can read settings
    if (resource === 'settings' && action === 'read') {
      return { allowed: true }
    }
  }

  return { allowed: false, reason: `Insufficient permissions (legacy role: ${role})` }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  user: SafeCmsUser,
  checks: Array<{ resource: PermissionResource; action: PermissionAction; resourceName?: string }>
): Promise<boolean> {
  for (const check of checks) {
    const result = await checkPermission(user, check.resource, check.action, check.resourceName)
    if (result.allowed) {
      return true
    }
  }
  return false
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  user: SafeCmsUser,
  checks: Array<{ resource: PermissionResource; action: PermissionAction; resourceName?: string }>
): Promise<boolean> {
  for (const check of checks) {
    const result = await checkPermission(user, check.resource, check.action, check.resourceName)
    if (!result.allowed) {
      return false
    }
  }
  return true
}

/**
 * Require permission - throws error if not allowed
 */
export async function requirePermission(
  user: SafeCmsUser,
  resource: PermissionResource,
  action: PermissionAction,
  resourceName?: string
): Promise<void> {
  const result = await checkPermission(user, resource, action, resourceName)

  if (!result.allowed) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        message: result.reason || 'You do not have permission to perform this action',
        resource,
        action,
        resourceName
      }
    })
  }
}

/**
 * Middleware helper to require permission on an endpoint
 */
export function withPermission(
  resource: PermissionResource,
  action: PermissionAction,
  resourceName?: string
) {
  return async (event: H3Event, user: SafeCmsUser) => {
    await requirePermission(user, resource, action, resourceName)
  }
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(user: SafeCmsUser): Promise<boolean> {
  if (!user.roleId) {
    return user.role === 'admin' // Legacy fallback
  }

  const db = useCmsDatabase()
  const rolesTable = getDatabaseType() === 'postgresql' ? rolesPostgres : rolesSqlite

  const roles = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.id, user.roleId))
    .limit(1)

  return roles.length > 0 && roles[0].name === 'super_admin'
}

/**
 * Get user's effective permissions (merged from role)
 */
export async function getUserPermissions(user: SafeCmsUser): Promise<RolePermissions | null> {
  if (!user.roleId) {
    // Return legacy permissions based on role
    return getLegacyPermissions(user.role || 'editor')
  }

  return getRolePermissions(user.roleId)
}

/**
 * Convert legacy role to permissions object
 */
function getLegacyPermissions(role: string): RolePermissions {
  if (role === 'admin') {
    return {
      collections: { '*': ['create', 'read', 'update', 'delete', 'publish'] },
      singletons: { '*': ['read', 'update', 'publish'] },
      media: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update'],
      roles: ['read'],
      settings: ['read']
    }
  }

  // Editor
  return {
    collections: { '*': ['create', 'read', 'update', 'publish'] },
    singletons: { '*': ['read', 'update'] },
    media: ['create', 'read', 'update'],
    users: [],
    roles: [],
    settings: ['read']
  }
}
