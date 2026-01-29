import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import {
  clearAuthToken,
  getAuthToken,
  getUserRoleFromToken,
  getUsers,
  isAdmin,
  isAuthenticated,
  isVolunteer,
  login,
  parseAuthError,
  register,
  setAuthToken,
  updateUserRole,
} from './auth'

// Mock the api module
vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return {
    ...actual,
    api: {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
    },
  }
})

import { api } from './api'

// Helper to create a mock JWT token
function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const signature = 'mock-signature'
  return `${header}.${body}.${signature}`
}

describe('auth', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('register', () => {
    it('should call api.post with correct endpoint and data', async () => {
      const mockResponse = {
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token',
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await register({
        email: 'test@ua.pt',
        password: 'password123',
        name: 'Test User',
        role: 'VOLUNTEER',
      })

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@ua.pt',
        password: 'password123',
        name: 'Test User',
        role: 'VOLUNTEER',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should register without role (optional)', async () => {
      const mockResponse = {
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token',
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await register({
        email: 'test@ua.pt',
        password: 'password123',
        name: 'Test User',
      })

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@ua.pt',
        password: 'password123',
        name: 'Test User',
      })
    })

    it('should propagate errors from api.post', async () => {
      const error = new ApiError(409, 'Conflict', 'Email already exists')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(
        register({
          email: 'existing@ua.pt',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(error)
    })
  })

  describe('login', () => {
    it('should call api.post with correct endpoint and data', async () => {
      const mockResponse = {
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token',
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await login({
        email: 'test@ua.pt',
        password: 'password123',
      })

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@ua.pt',
        password: 'password123',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should return AuthResponse on success', async () => {
      const mockResponse = {
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'jwt-token-here',
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await login({
        email: 'test@ua.pt',
        password: 'password123',
      })

      expect(result.id).toBe(1)
      expect(result.email).toBe('test@ua.pt')
      expect(result.name).toBe('Test User')
      expect(result.role).toBe('VOLUNTEER')
      expect(result.token).toBe('jwt-token-here')
    })

    it('should propagate errors from api.post', async () => {
      const error = new ApiError(401, 'Unauthorized', 'Invalid credentials')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(
        login({
          email: 'test@ua.pt',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(error)
    })
  })

  describe('setAuthToken', () => {
    it('should store token in localStorage', () => {
      setAuthToken('test-token-123')

      expect(localStorage.getItem('auth_token')).toBe('test-token-123')
    })

    it('should overwrite existing token', () => {
      localStorage.setItem('auth_token', 'old-token')

      setAuthToken('new-token')

      expect(localStorage.getItem('auth_token')).toBe('new-token')
    })
  })

  describe('clearAuthToken', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('auth_token', 'test-token')

      clearAuthToken()

      expect(localStorage.getItem('auth_token')).toBeNull()
    })

    it('should not throw if no token exists', () => {
      expect(() => clearAuthToken()).not.toThrow()
    })
  })

  describe('getAuthToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('auth_token', 'stored-token')

      expect(getAuthToken()).toBe('stored-token')
    })

    it('should return null if no token exists', () => {
      expect(getAuthToken()).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'valid-token')

      expect(isAuthenticated()).toBe(true)
    })

    it('should return false when no token exists', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('should return false when token is empty string', () => {
      localStorage.setItem('auth_token', '')

      expect(isAuthenticated()).toBe(false)
    })
  })

  describe('parseAuthError', () => {
    it('should parse ApiError with JSON message', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Email already registered',
      })
      const error = new ApiError(409, 'Conflict', errorBody)

      const result = await parseAuthError(error)

      expect(result).toBe('Email already registered')
    })

    it('should return default message when message is missing from error body', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 500,
        error: 'Internal Server Error',
      })
      const error = new ApiError(500, 'Internal Server Error', errorBody)

      const result = await parseAuthError(error)

      expect(result).toBe('An error occurred')
    })

    it('should return error.message when JSON parsing fails', async () => {
      const error = new ApiError(400, 'Bad Request', 'Not valid JSON')

      const result = await parseAuthError(error)

      expect(result).toBe('Not valid JSON')
    })

    it('should return error message from ApiError when JSON parsing fails on empty string', async () => {
      // When message is empty string, JSON.parse throws, so it falls back to error.message
      // ApiError constructor sets message to "API Error: status statusText" when message is empty
      const error = new ApiError(500, 'Internal Server Error', '')

      const result = await parseAuthError(error)

      // Falls back to error.message which is set by ApiError constructor
      expect(result).toBe('API Error: 500 Internal Server Error')
    })

    it('should return unexpected error message for non-ApiError', async () => {
      const error = new Error('Some generic error')

      const result = await parseAuthError(error)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for unknown error types', async () => {
      const result = await parseAuthError('string error')

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for null', async () => {
      const result = await parseAuthError(null)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for undefined', async () => {
      const result = await parseAuthError(undefined)

      expect(result).toBe('An unexpected error occurred')
    })
  })

  describe('getUserRoleFromToken', () => {
    it('should return role from valid token', () => {
      const token = createMockJwt({ id: 1, email: 'test@ua.pt', name: 'Test', role: 'ADMIN' })
      localStorage.setItem('auth_token', token)

      expect(getUserRoleFromToken()).toBe('ADMIN')
    })

    it('should return null when no token exists', () => {
      expect(getUserRoleFromToken()).toBeNull()
    })

    it('should return null for invalid token format', () => {
      localStorage.setItem('auth_token', 'invalid-token')

      expect(getUserRoleFromToken()).toBeNull()
    })

    it('should return null for token without role', () => {
      const token = createMockJwt({ id: 1, email: 'test@ua.pt', name: 'Test' })
      localStorage.setItem('auth_token', token)

      expect(getUserRoleFromToken()).toBeNull()
    })

    it('should return null for token without email', () => {
      const token = createMockJwt({ id: 1, role: 'VOLUNTEER' })
      localStorage.setItem('auth_token', token)

      expect(getUserRoleFromToken()).toBeNull()
    })

    it('should handle token with sub instead of id', () => {
      const token = createMockJwt({ sub: 1, email: 'test@ua.pt', role: 'VOLUNTEER' })
      localStorage.setItem('auth_token', token)

      expect(getUserRoleFromToken()).toBe('VOLUNTEER')
    })

    it('should return null for malformed base64 payload', () => {
      localStorage.setItem('auth_token', 'header.not-valid-base64!@#$.signature')

      expect(getUserRoleFromToken()).toBeNull()
    })
  })

  describe('isAdmin', () => {
    it('should return true when user role is ADMIN', () => {
      const token = createMockJwt({ id: 1, email: 'admin@ua.pt', role: 'ADMIN' })
      localStorage.setItem('auth_token', token)

      expect(isAdmin()).toBe(true)
    })

    it('should return false when user role is VOLUNTEER', () => {
      const token = createMockJwt({ id: 1, email: 'volunteer@ua.pt', role: 'VOLUNTEER' })
      localStorage.setItem('auth_token', token)

      expect(isAdmin()).toBe(false)
    })

    it('should return false when user role is PROMOTER', () => {
      const token = createMockJwt({ id: 1, email: 'promoter@ua.pt', role: 'PROMOTER' })
      localStorage.setItem('auth_token', token)

      expect(isAdmin()).toBe(false)
    })

    it('should return false when user role is PARTNER', () => {
      const token = createMockJwt({ id: 1, email: 'partner@ua.pt', role: 'PARTNER' })
      localStorage.setItem('auth_token', token)

      expect(isAdmin()).toBe(false)
    })

    it('should return false when no token exists', () => {
      expect(isAdmin()).toBe(false)
    })

    it('should return false for invalid token', () => {
      localStorage.setItem('auth_token', 'invalid')

      expect(isAdmin()).toBe(false)
    })
  })

  describe('isVolunteer', () => {
    it('should return true when user role is VOLUNTEER', () => {
      const token = createMockJwt({ id: 1, email: 'volunteer@ua.pt', role: 'VOLUNTEER' })
      localStorage.setItem('auth_token', token)

      expect(isVolunteer()).toBe(true)
    })

    it('should return false when user role is ADMIN', () => {
      const token = createMockJwt({ id: 1, email: 'admin@ua.pt', role: 'ADMIN' })
      localStorage.setItem('auth_token', token)

      expect(isVolunteer()).toBe(false)
    })

    it('should return false when user role is PROMOTER', () => {
      const token = createMockJwt({ id: 1, email: 'promoter@ua.pt', role: 'PROMOTER' })
      localStorage.setItem('auth_token', token)

      expect(isVolunteer()).toBe(false)
    })

    it('should return false when user role is PARTNER', () => {
      const token = createMockJwt({ id: 1, email: 'partner@ua.pt', role: 'PARTNER' })
      localStorage.setItem('auth_token', token)

      expect(isVolunteer()).toBe(false)
    })

    it('should return false when no token exists', () => {
      expect(isVolunteer()).toBe(false)
    })

    it('should return false for invalid token', () => {
      localStorage.setItem('auth_token', 'invalid')

      expect(isVolunteer()).toBe(false)
    })
  })

  describe('getUsers', () => {
    it('should call api.get with default parameters', async () => {
      const mockResponse = {
        users: [],
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        pageSize: 10,
        hasNext: false,
        hasPrevious: false,
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await getUsers()

      expect(api.get).toHaveBeenCalledWith('/admin/users', {
        params: {
          page: 0,
          size: 10,
          search: undefined,
          role: undefined,
          sortBy: 'createdAt',
          sortDir: 'desc',
        },
      })
    })

    it('should call api.get with custom parameters', async () => {
      const mockResponse = {
        users: [],
        currentPage: 1,
        totalPages: 5,
        totalElements: 50,
        pageSize: 20,
        hasNext: true,
        hasPrevious: true,
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await getUsers({
        page: 1,
        size: 20,
        search: 'john',
        role: 'VOLUNTEER',
        sortBy: 'name',
        sortDir: 'asc',
      })

      expect(api.get).toHaveBeenCalledWith('/admin/users', {
        params: {
          page: 1,
          size: 20,
          search: 'john',
          role: 'VOLUNTEER',
          sortBy: 'name',
          sortDir: 'asc',
        },
      })
    })

    it('should return UserPageResponse', async () => {
      const mockResponse = {
        users: [
          {
            id: 1,
            email: 'test@ua.pt',
            name: 'Test User',
            role: 'VOLUNTEER',
            points: 100,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        currentPage: 0,
        totalPages: 1,
        totalElements: 1,
        pageSize: 10,
        hasNext: false,
        hasPrevious: false,
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getUsers()

      expect(result).toEqual(mockResponse)
      expect(result.users).toHaveLength(1)
      expect(result.users[0].email).toBe('test@ua.pt')
    })

    it('should propagate errors from api.get', async () => {
      const error = new ApiError(403, 'Forbidden', 'Access denied')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getUsers()).rejects.toThrow(error)
    })
  })

  describe('updateUserRole', () => {
    it('should call api.put with correct endpoint and data', async () => {
      const mockResponse = {
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'ADMIN',
        points: 0,
        createdAt: '2024-01-01T00:00:00Z',
      }
      vi.mocked(api.put).mockResolvedValue(mockResponse)

      await updateUserRole(1, 'ADMIN')

      expect(api.put).toHaveBeenCalledWith('/admin/users/1/role', { role: 'ADMIN' })
    })

    it('should return updated UserResponse', async () => {
      const mockResponse = {
        id: 2,
        email: 'volunteer@ua.pt',
        name: 'Volunteer User',
        role: 'PROMOTER',
        points: 50,
        createdAt: '2024-01-01T00:00:00Z',
      }
      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await updateUserRole(2, 'PROMOTER')

      expect(result).toEqual(mockResponse)
      expect(result.role).toBe('PROMOTER')
    })

    it('should propagate errors from api.put', async () => {
      const error = new ApiError(404, 'Not Found', 'User not found')
      vi.mocked(api.put).mockRejectedValue(error)

      await expect(updateUserRole(999, 'ADMIN')).rejects.toThrow(error)
    })

    it('should handle self-role change error', async () => {
      const error = new ApiError(400, 'Bad Request', 'Cannot change your own role')
      vi.mocked(api.put).mockRejectedValue(error)

      await expect(updateUserRole(1, 'VOLUNTEER')).rejects.toThrow(error)
    })
  })
})
