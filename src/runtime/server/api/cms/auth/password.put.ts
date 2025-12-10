import { defineEventHandler, readBody, createError } from '#imports'
import { requireAuth, verifyPassword, hashPassword, validatePassword, clearAuthCookie } from '../../../utils/auth'
import { useCmsDatabase, usersSqlite, usersPostgres, getDatabaseType } from '../../../database/client'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required')
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  const body = await readBody(event)

  // Validate input
  const result = changePasswordSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.flatten()
    })
  }

  const { currentPassword, newPassword } = result.data

  // Validate new password against policy
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password does not meet requirements',
      data: {
        errors: passwordValidation.errors
      }
    })
  }

  // Get user from database to verify current password
  const db = useCmsDatabase()
  const usersTable = getDatabaseType() === 'postgresql' ? usersPostgres : usersSqlite

  const users = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1)

  if (users.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  const dbUser = users[0]

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, dbUser.passwordHash)
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Current password is incorrect'
    })
  }

  // Check that new password is different from current
  const isSamePassword = await verifyPassword(newPassword, dbUser.passwordHash)
  if (isSamePassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be different from current password'
    })
  }

  // Hash and update password
  const newPasswordHash = await hashPassword(newPassword)

  await db.update(usersTable)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    })
    .where(eq(usersTable.id, user.id))

  // Clear auth cookie to force re-login with new password
  clearAuthCookie(event)

  return {
    success: true,
    message: 'Password changed successfully. Please log in again.'
  }
})
