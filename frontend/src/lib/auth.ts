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
