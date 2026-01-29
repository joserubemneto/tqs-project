import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import { getProfile, getSkills, parseProfileError, updateProfile } from './profile'

// Mock the api module
vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return {
    ...actual,
    api: {
      get: vi.fn(),
      put: vi.fn(),
    },
  }
})

import { api } from './api'

describe('profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getProfile', () => {
    it('should call api.get with correct endpoint', async () => {
      const mockResponse = {
        id: 1,
        email: 'volunteer@ua.pt',
        name: 'Sample Volunteer',
        role: 'VOLUNTEER',
        points: 50,
        bio: 'I love volunteering',
        skills: [{ id: 1, name: 'Communication', category: 'COMMUNICATION' }],
        createdAt: '2024-01-01T00:00:00Z',
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getProfile()

      expect(api.get).toHaveBeenCalledWith('/profile')
      expect(result).toEqual(mockResponse)
    })

    it('should return ProfileResponse with all fields', async () => {
      const mockResponse = {
        id: 1,
        email: 'volunteer@ua.pt',
        name: 'Sample Volunteer',
        role: 'VOLUNTEER',
        points: 50,
        bio: 'I love volunteering',
        skills: [
          {
            id: 1,
            name: 'Communication',
            category: 'COMMUNICATION',
            description: 'Effective communication',
          },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getProfile()

      expect(result.id).toBe(1)
      expect(result.email).toBe('volunteer@ua.pt')
      expect(result.name).toBe('Sample Volunteer')
      expect(result.role).toBe('VOLUNTEER')
      expect(result.points).toBe(50)
      expect(result.bio).toBe('I love volunteering')
      expect(result.skills).toHaveLength(1)
      expect(result.skills[0].name).toBe('Communication')
      expect(result.createdAt).toBe('2024-01-01T00:00:00Z')
      expect(result.updatedAt).toBe('2024-01-02T00:00:00Z')
    })

    it('should return profile without optional fields', async () => {
      const mockResponse = {
        id: 1,
        email: 'volunteer@ua.pt',
        name: 'Sample Volunteer',
        role: 'VOLUNTEER',
        points: 0,
        skills: [],
        createdAt: '2024-01-01T00:00:00Z',
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getProfile()

      expect(result.bio).toBeUndefined()
      expect(result.updatedAt).toBeUndefined()
      expect(result.skills).toEqual([])
    })

    it('should propagate errors from api.get', async () => {
      const error = new ApiError(401, 'Unauthorized', 'Invalid token')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getProfile()).rejects.toThrow(error)
    })

    it('should propagate 404 error when user not found', async () => {
      const error = new ApiError(404, 'Not Found', 'User not found')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getProfile()).rejects.toThrow(error)
    })
  })

  describe('updateProfile', () => {
    it('should call api.put with correct endpoint and data', async () => {
      const mockResponse = {
        id: 1,
        email: 'volunteer@ua.pt',
        name: 'Updated Name',
        role: 'VOLUNTEER',
        points: 50,
        bio: 'Updated bio',
        skills: [],
        createdAt: '2024-01-01T00:00:00Z',
      }
      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await updateProfile({
        name: 'Updated Name',
        bio: 'Updated bio',
        skillIds: [],
      })

      expect(api.put).toHaveBeenCalledWith('/profile', {
        name: 'Updated Name',
        bio: 'Updated bio',
        skillIds: [],
      })
      expect(result).toEqual(mockResponse)
    })

    it('should update profile with skills', async () => {
      const mockResponse = {
        id: 1,
        email: 'volunteer@ua.pt',
        name: 'Sample Volunteer',
        role: 'VOLUNTEER',
        points: 50,
        bio: 'I love volunteering',
        skills: [
          { id: 1, name: 'Communication', category: 'COMMUNICATION' },
          { id: 2, name: 'Leadership', category: 'LEADERSHIP' },
        ],
        createdAt: '2024-01-01T00:00:00Z',
      }
      vi.mocked(api.put).mockResolvedValue(mockResponse)

      await updateProfile({
        name: 'Sample Volunteer',
        bio: 'I love volunteering',
        skillIds: [1, 2],
      })

      expect(api.put).toHaveBeenCalledWith('/profile', {
        name: 'Sample Volunteer',
        bio: 'I love volunteering',
        skillIds: [1, 2],
      })
    })

    it('should update profile without bio', async () => {
      const mockResponse = {
        id: 1,
        email: 'volunteer@ua.pt',
        name: 'Sample Volunteer',
        role: 'VOLUNTEER',
        points: 50,
        skills: [],
        createdAt: '2024-01-01T00:00:00Z',
      }
      vi.mocked(api.put).mockResolvedValue(mockResponse)

      await updateProfile({
        name: 'Sample Volunteer',
        skillIds: [],
      })

      expect(api.put).toHaveBeenCalledWith('/profile', {
        name: 'Sample Volunteer',
        skillIds: [],
      })
    })

    it('should propagate validation errors from api.put', async () => {
      const error = new ApiError(400, 'Bad Request', 'Name is required')
      vi.mocked(api.put).mockRejectedValue(error)

      await expect(
        updateProfile({
          name: '',
          skillIds: [],
        }),
      ).rejects.toThrow(error)
    })

    it('should propagate 401 error when not authenticated', async () => {
      const error = new ApiError(401, 'Unauthorized', 'Invalid token')
      vi.mocked(api.put).mockRejectedValue(error)

      await expect(
        updateProfile({
          name: 'Updated Name',
          skillIds: [],
        }),
      ).rejects.toThrow(error)
    })
  })

  describe('getSkills', () => {
    it('should call api.get with correct endpoint without category', async () => {
      const mockResponse = [
        { id: 1, name: 'Communication', category: 'COMMUNICATION' },
        { id: 2, name: 'Leadership', category: 'LEADERSHIP' },
      ]
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getSkills()

      expect(api.get).toHaveBeenCalledWith('/skills', {
        params: undefined,
      })
      expect(result).toEqual(mockResponse)
    })

    it('should call api.get with category filter', async () => {
      const mockResponse = [{ id: 1, name: 'Communication', category: 'COMMUNICATION' }]
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getSkills('COMMUNICATION')

      expect(api.get).toHaveBeenCalledWith('/skills', {
        params: { category: 'COMMUNICATION' },
      })
      expect(result).toEqual(mockResponse)
    })

    it('should return empty array when no skills match', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const result = await getSkills('OTHER')

      expect(result).toEqual([])
    })

    it('should return skills with all fields', async () => {
      const mockResponse = [
        {
          id: 1,
          name: 'Communication',
          category: 'COMMUNICATION',
          description: 'Effective communication skills',
        },
      ]
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getSkills()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBe('Communication')
      expect(result[0].category).toBe('COMMUNICATION')
      expect(result[0].description).toBe('Effective communication skills')
    })

    it('should propagate errors from api.get', async () => {
      const error = new ApiError(401, 'Unauthorized', 'Invalid token')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getSkills()).rejects.toThrow(error)
    })
  })

  describe('parseProfileError', () => {
    it('should parse ApiError with JSON message', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Name is required',
      })
      const error = new ApiError(400, 'Bad Request', errorBody)

      const result = await parseProfileError(error)

      expect(result).toBe('Name is required')
    })

    it('should return default message when message is missing from error body', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 500,
        error: 'Internal Server Error',
      })
      const error = new ApiError(500, 'Internal Server Error', errorBody)

      const result = await parseProfileError(error)

      expect(result).toBe('An error occurred')
    })

    it('should return error.message when JSON parsing fails', async () => {
      const error = new ApiError(400, 'Bad Request', 'Not valid JSON')

      const result = await parseProfileError(error)

      expect(result).toBe('Not valid JSON')
    })

    it('should return error message from ApiError when JSON parsing fails on empty string', async () => {
      const error = new ApiError(500, 'Internal Server Error', '')

      const result = await parseProfileError(error)

      expect(result).toBe('API Error: 500 Internal Server Error')
    })

    it('should return unexpected error message for non-ApiError', async () => {
      const error = new Error('Some generic error')

      const result = await parseProfileError(error)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for unknown error types', async () => {
      const result = await parseProfileError('string error')

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for null', async () => {
      const result = await parseProfileError(null)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for undefined', async () => {
      const result = await parseProfileError(undefined)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should handle validation errors in response', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        validationErrors: {
          name: 'Name is required',
          bio: 'Bio must be at most 500 characters',
        },
      })
      const error = new ApiError(400, 'Bad Request', errorBody)

      const result = await parseProfileError(error)

      expect(result).toBe('Validation failed')
    })
  })
})
