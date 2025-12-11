import { defineEventHandler, readBody, createError } from '#imports'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { requireAuth } from '../../../utils/auth'
import { requirePermission, isSuperAdmin } from '../../../utils/permissions'
import { useCmsDatabase, usersSqlite, usersPostgres, rolesSqlite, rolesPostgres, getDatabaseType } from '../../../database/client'
import { getRoleIdByName } from '../../../utils/seedRoles'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuth(event)

  // Check create permission for users
  await requirePermission(currentUser, 'users', 'create')

  const body = await readBody(event)
  const { username, email, password, roleId, avatar } = body

  // Validate required fields
  if (!username || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username, email, and password are required'
    })
  }

  // Validate password length
  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters'
    })
  }

  const db = useCmsDatabase()
  const isPostgres = getDatabaseType() === 'postgresql'
  const usersTable = isPostgres ? usersPostgres : usersSqlite
  const rolesTable = isPostgres ? rolesPostgres : rolesSqlite

  // Check if username or email already exists
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1)

  if (existingUser.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username already exists'
    })
  }

  const existingEmail = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1)

  if (existingEmail.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email already exists'
    })
  }

  // Validate role assignment
  let assignedRoleId = roleId
  if (roleId) {
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
  } else {
    // Default to editor role
    assignedRoleId = await getRoleIdByName('editor')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  const now = new Date()
  const userId = nanoid()

  // Create user
  await db.insert(usersTable).values({
    id: userId,
    username,
    email,
    password: hashedPassword,
    avatar: avatar || null,
    role: 'editor', // Legacy field
    roleId: assignedRoleId,
    createdAt: now,
    updatedAt: now
  })

  return {
    success: true,
    id: userId
  }
})
