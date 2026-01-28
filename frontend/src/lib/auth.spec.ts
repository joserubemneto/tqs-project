import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError } from './api'
import {
  register,
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  isAuthenticated,
  parseAuthError,
} from './auth'

// Mock the api module
vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return {
    ...actual,
    api: {
      post: vi.fn(),
    },
  }
})

import { api } from './api'

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

    it('should return default message when ApiError has no message', async () => {
      const error = new ApiError(500, 'Internal Server Error', '')

      const result = await parseAuthError(error)

      expect(result).toBe('An error occurred')
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
})
