import { ApiError, api } from './api'

export type UserRole = 'VOLUNTEER' | 'PROMOTER' | 'PARTNER' | 'ADMIN'

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  id: number
  email: string
  name: string
  role: UserRole
  token: string
}

export interface AuthError {
  timestamp: string
  status: number
  error: string
  message: string
  validationErrors?: Record<string, string>
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', data)
}

/**
 * Login an existing user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', data)
}

/**
 * Store auth token in localStorage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

/**
 * Remove auth token from localStorage
 */
export function clearAuthToken(): void {
  localStorage.removeItem('auth_token')
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token')
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

/**
 * Decode JWT token to extract user information
 */
function decodeToken(
  token: string,
): { id: number; email: string; name: string; role: UserRole } | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const decoded = JSON.parse(atob(payload))
    if (!decoded.email || !decoded.role) return null

    return {
      id: decoded.id || decoded.sub || 0,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
      role: decoded.role,
    }
  } catch {
    return null
  }
}

/**
 * Get user role from stored token
 */
export function getUserRoleFromToken(): UserRole | null {
  const token = getAuthToken()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded?.role ?? null
}

/**
 * Check if current user is an admin
 */
export function isAdmin(): boolean {
  return getUserRoleFromToken() === 'ADMIN'
}

/**
 * Check if current user is a volunteer
 */
export function isVolunteer(): boolean {
  return getUserRoleFromToken() === 'VOLUNTEER'
}

/**
 * Parse API error response
 */
export async function parseAuthError(error: unknown): Promise<string> {
  if (error instanceof ApiError) {
    try {
      const errorBody: AuthError = JSON.parse(error.message)
      return errorBody.message || 'An error occurred'
    } catch {
      return error.message || 'An error occurred'
    }
  }
  return 'An unexpected error occurred'
}

// ==================== Admin API Types ====================

export interface UserResponse {
  id: number
  email: string
  name: string
  role: UserRole
  points: number
  createdAt: string
}

export interface UserPageResponse {
  users: UserResponse[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface GetUsersParams {
  page?: number
  size?: number
  search?: string
  role?: UserRole
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface UpdateRoleRequest {
  role: UserRole
}

// ==================== Admin API Functions ====================

/**
 * Get paginated list of users (admin only)
 */
export async function getUsers(params: GetUsersParams = {}): Promise<UserPageResponse> {
  return api.get<UserPageResponse>('/admin/users', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      search: params.search,
      role: params.role,
      sortBy: params.sortBy ?? 'createdAt',
      sortDir: params.sortDir ?? 'desc',
    },
  })
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(userId: number, role: UserRole): Promise<UserResponse> {
  return api.put<UserResponse>(`/admin/users/${userId}/role`, { role })
}
