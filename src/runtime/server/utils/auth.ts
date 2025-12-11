import { useRuntimeConfig, getCookie, getHeader, setCookie, deleteCookie, createError } from '#imports'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'
import { useCmsDatabase, usersSqlite, usersPostgres, getDatabaseType } from '../database/client'
import type { SafeCmsUser, JwtPayload, UserRole } from '../../types'

const BCRYPT_ROUNDS = 12
const JWT_EXPIRATION = '7d'
const COOKIE_NAME = 'cms_session'
const DEFAULT_JWT_SECRET = 'change-this-secret-in-production'

// Password policy constants
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REQUIRES_UPPERCASE = true
const PASSWORD_REQUIRES_LOWERCASE = true
const PASSWORD_REQUIRES_NUMBER = true

/**
 * Validate JWT secret is properly configured
 */
export function validateJwtSecret(): void {
  const config = useRuntimeConfig()
  const secret = config.cms?.jwtSecret

  if (!secret || secret === DEFAULT_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[CMS Security Error] JWT secret is not configured or using default value. ' +
        'Set CMS_JWT_SECRET environment variable with a strong random string (min 32 characters).'
      )
    } else {
      console.warn(
        '[CMS Warning] Using default JWT secret. This is insecure for production. ' +
        'Set CMS_JWT_SECRET environment variable.'
      )
    }
  }

  if (secret && secret.length < 32) {
    console.warn('[CMS Warning] JWT secret should be at least 32 characters for security.')
  }
}

/**
 * Password policy validation result
 */
export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate password against security policy
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  }

  if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (PASSWORD_REQUIRES_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (PASSWORD_REQUIRES_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Create a JWT token
 */
export async function createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.cms.jwtSecret)

  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secret)
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.cms.jwtSecret)

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

/**
 * Get user from event (from cookie or authorization header)
 */
export async function getUserFromEvent(event: any): Promise<SafeCmsUser | null> {
  // Try cookie first
  let token = getCookie(event, COOKIE_NAME)

  // Try Authorization header
  if (!token) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  // Get user from database
  const db = useCmsDatabase()
  const usersTable = getDatabaseType() === 'postgresql' ? usersPostgres : usersSqlite

  const users = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1)

  if (users.length === 0) return null

  const user = users[0]
  if (!user.active) return null

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    role: user.role as UserRole | null,
    roleId: user.roleId || null,
    active: user.active,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  }
}

/**
 * Require authentication for an event
 */
export async function requireAuth(event: any): Promise<SafeCmsUser> {
  const user = await getUserFromEvent(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return user
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(event: any, token: string) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(event: any) {
  deleteCookie(event, COOKIE_NAME, {
    path: '/'
  })
}

/**
 * Create initial admin user if it doesn't exist
 */
export async function createInitialAdmin(username: string, password: string): Promise<void> {
  const db = useCmsDatabase()
  const usersTable = getDatabaseType() === 'postgresql' ? usersPostgres : usersSqlite

  // Check if admin already exists
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1)

  if (existing.length > 0) {
    console.log('[CMS] Admin user already exists')
    return
  }

  // Create admin user
  const passwordHash = await hashPassword(password)
  const now = new Date()

  await db.insert(usersTable).values({
    id: nanoid(),
    username,
    passwordHash,
    role: 'admin',
    active: true,
    createdAt: now,
    updatedAt: now
  })

  console.log('[CMS] Initial admin user created')
}

/**
 * Login user
 */
export async function loginUser(username: string, password: string): Promise<{ user: SafeCmsUser; token: string } | null> {
  const db = useCmsDatabase()
  const usersTable = getDatabaseType() === 'postgresql' ? usersPostgres : usersSqlite

  // Find user
  const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1)

  if (users.length === 0) return null

  const user = users[0]

  // Check if active
  if (!user.active) return null

  // Verify password
  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return null

  // Update last login
  await db.update(usersTable)
    .set({ lastLogin: new Date() })
    .where(eq(usersTable.id, user.id))

  // Create token with roleId
  const token = await createToken({
    sub: user.id,
    username: user.username,
    role: user.role as UserRole | null,
    roleId: user.roleId || null
  })

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar || null,
      role: user.role as UserRole | null,
      roleId: user.roleId || null,
      active: user.active,
      lastLogin: new Date(),
      createdAt: user.createdAt
    },
    token
  }
}
