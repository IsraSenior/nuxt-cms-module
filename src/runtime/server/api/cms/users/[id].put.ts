import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { requireAuth } from '../../../utils/auth'
import { requirePermission, isSuperAdmin } from '../../../utils/permissions'
import { useCmsDatabase, usersSqlite, usersPostgres, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuth(event)

  // Check update permission for users
  await requirePermission(currentUser, 'users', 'update')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  const body = await readBody(event)
  const { username, email, password, roleId, avatar } = body

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const usersTable = isPostgres ? usersPostgres : usersSqlite
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite

  // Check if user exists
  const existingUsers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1)

  if (existingUsers.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  const existingUser = existingUsers[0]

  // Prevent modifying own super_admin status
  if (currentUser.id === id && roleId && roleId !== existingUser.roleId) {
    const currentRole = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, existingUser.roleId || ''))
      .limit(1)

    if (currentRole.length > 0 && currentRole[0].name === 'super_admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot change your own super_admin role'
      })
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (username && username !== existingUser.username) {
    // Check if new username is taken
    const usernameTaken = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1)

    if (usernameTaken.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username already exists'
      })
    }
    updateData.username = username
  }

  if (email && email !== existingUser.email) {
    // Check if new email is taken
    const emailTaken = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)

    if (emailTaken.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already exists'
      })
    }
    updateData.email = email
  }

  if (password) {
    if (password.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters'
      })
    }
    updateData.password = await bcrypt.hash(password, 12)
  }

  if (avatar !== undefined) {
    updateData.avatar = avatar || null
  }

  if (roleId && roleId !== existingUser.roleId) {
    // Validate role exists
    const role = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, roleId))
      .limit(1)

    if (role.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid role ID'
      })
    }

    // Only super_admin can assign super_admin role
    if (role[0].name === 'super_admin') {
      const isSuper = await isSuperAdmin(currentUser)
      if (!isSuper) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Only super administrators can assign the super_admin role'
        })
      }
    }

    updateData.roleId = roleId
  }

  // Update user
  await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, id))

  return {
    success: true
  }
})
