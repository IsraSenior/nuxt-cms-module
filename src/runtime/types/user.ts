/**
 * User role (legacy)
 */
export type UserRole = 'admin' | 'editor'

/**
 * CMS user stored in database
 */
export interface CmsUser {
  /** Unique identifier */
  id: string
  /** Username for login */
  username: string
  /** Hashed password */
  passwordHash: string
  /** Email address */
  email: string | null
  /** Display name */
  name: string | null
  /** Avatar URL */
  avatar: string | null
  /** User role (legacy - for backwards compatibility) */
  role: UserRole | null
  /** Role ID (new RBAC system) */
  roleId: string | null
  /** Whether user is active */
  active: boolean
  /** Last login timestamp */
  lastLogin: Date | null
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
}

/**
 * User without sensitive data
 */
export interface SafeCmsUser {
  id: string
  username: string
  email: string | null
  name: string | null
  avatar: string | null
  /** Legacy role field */
  role: UserRole | null
  /** New role ID (RBAC) */
  roleId: string | null
  /** Role name (resolved from roleId) */
  roleName?: string
  active: boolean
  lastLogin: Date | null
  createdAt: Date
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string
  password: string
}

/**
 * JWT payload
 */
export interface JwtPayload {
  /** User ID */
  sub: string
  /** Username */
  username: string
  /** User role (legacy) */
  role: UserRole | null
  /** Role ID (RBAC) */
  roleId: string | null
  /** Issued at */
  iat: number
  /** Expiration */
  exp: number
}

/**
 * Auth session
 */
export interface AuthSession {
  user: SafeCmsUser
  token: string
  expiresAt: Date
}

/**
 * Convert full user to safe user (without password)
 */
export function toSafeUser(user: CmsUser, roleName?: string): SafeCmsUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    roleId: user.roleId,
    roleName,
    active: user.active,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  }
}
