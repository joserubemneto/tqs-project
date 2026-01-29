import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import {
  applyToOpportunity,
  getApplicationStatusColor,
  getApplicationStatusLabel,
  getApprovedApplicationCount,
  getMyApplicationForOpportunity,
  getMyApplications,
  parseApplicationError,
} from './application'

// Mock the api module
vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  }
})

// Mock fetch for getMyApplicationForOpportunity
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
})

import { api } from './api'

describe('application', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('applyToOpportunity', () => {
    const mockApplication = {
      id: 1,
      status: 'PENDING',
      message: 'I would love to help!',
      appliedAt: '2024-01-15T10:00:00Z',
      opportunity: {
        id: 1,
        title: 'UA Open Day Support',
        status: 'OPEN',
        startDate: '2024-02-01T09:00:00Z',
        endDate: '2024-02-07T17:00:00Z',
        pointsReward: 50,
        location: 'University Campus',
      },
      volunteer: {
        id: 1,
        email: 'volunteer@ua.pt',
        name: 'Volunteer User',
        role: 'VOLUNTEER',
        points: 0,
      },
    }

    it('should call api.post with correct endpoint and data', async () => {
      vi.mocked(api.post).mockResolvedValue(mockApplication)

      const result = await applyToOpportunity(1, 'I would love to help!')

      expect(api.post).toHaveBeenCalledWith('/applications', {
        opportunityId: 1,
        message: 'I would love to help!',
      })
      expect(result).toEqual(mockApplication)
    })

    it('should call api.post without message when not provided', async () => {
      vi.mocked(api.post).mockResolvedValue(mockApplication)

      await applyToOpportunity(1)

      expect(api.post).toHaveBeenCalledWith('/applications', {
        opportunityId: 1,
        message: undefined,
      })
    })

    it('should return ApplicationResponse with all fields', async () => {
      vi.mocked(api.post).mockResolvedValue(mockApplication)

      const result = await applyToOpportunity(1)

      expect(result.id).toBe(1)
      expect(result.status).toBe('PENDING')
      expect(result.message).toBe('I would love to help!')
      expect(result.opportunity.id).toBe(1)
      expect(result.opportunity.title).toBe('UA Open Day Support')
      expect(result.volunteer.email).toBe('volunteer@ua.pt')
    })

    it('should propagate 409 error when already applied', async () => {
      const error = new ApiError(409, 'Conflict', 'Already applied')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(applyToOpportunity(1)).rejects.toThrow(error)
    })

    it('should propagate 409 error when no spots available', async () => {
      const error = new ApiError(409, 'Conflict', 'No spots available')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(applyToOpportunity(1)).rejects.toThrow(error)
    })

    it('should propagate 404 error when opportunity not found', async () => {
      const error = new ApiError(404, 'Not Found', 'Opportunity not found with id: 999')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(applyToOpportunity(999)).rejects.toThrow(error)
    })

    it('should propagate 400 error when opportunity is not open', async () => {
      const error = new ApiError(400, 'Bad Request', 'Cannot apply to opportunity that is not open')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(applyToOpportunity(1)).rejects.toThrow(error)
    })

    it('should propagate 401 error when not authenticated', async () => {
      const error = new ApiError(401, 'Unauthorized', 'Invalid token')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(applyToOpportunity(1)).rejects.toThrow(error)
    })

    it('should propagate 403 error when not a volunteer', async () => {
      const error = new ApiError(403, 'Forbidden', 'Access denied')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(applyToOpportunity(1)).rejects.toThrow(error)
    })
  })

  describe('getMyApplications', () => {
    const mockApplications = [
      {
        id: 1,
        status: 'PENDING',
        message: 'I would love to help!',
        appliedAt: '2024-01-15T10:00:00Z',
        opportunity: {
          id: 1,
          title: 'UA Open Day Support',
          status: 'OPEN',
          startDate: '2024-02-01T09:00:00Z',
          endDate: '2024-02-07T17:00:00Z',
          pointsReward: 50,
          location: 'University Campus',
        },
        volunteer: {
          id: 1,
          email: 'volunteer@ua.pt',
          name: 'Volunteer',
          role: 'VOLUNTEER',
          points: 0,
        },
      },
      {
        id: 2,
        status: 'APPROVED',
        message: null,
        appliedAt: '2024-01-10T14:00:00Z',
        opportunity: {
          id: 2,
          title: 'Beach Cleanup',
          status: 'OPEN',
          startDate: '2024-03-01T08:00:00Z',
          endDate: '2024-03-01T12:00:00Z',
          pointsReward: 30,
          location: 'Praia da Costa Nova',
        },
        volunteer: {
          id: 1,
          email: 'volunteer@ua.pt',
          name: 'Volunteer',
          role: 'VOLUNTEER',
          points: 0,
        },
      },
    ]

    it('should call api.get with correct endpoint', async () => {
      vi.mocked(api.get).mockResolvedValue(mockApplications)

      const result = await getMyApplications()

      expect(api.get).toHaveBeenCalledWith('/applications/my')
      expect(result).toEqual(mockApplications)
    })

    it('should return array of ApplicationResponse', async () => {
      vi.mocked(api.get).mockResolvedValue(mockApplications)

      const result = await getMyApplications()

      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('PENDING')
      expect(result[1].status).toBe('APPROVED')
    })

    it('should return applications with opportunity details', async () => {
      vi.mocked(api.get).mockResolvedValue(mockApplications)

      const result = await getMyApplications()

      expect(result[0].opportunity.title).toBe('UA Open Day Support')
      expect(result[1].opportunity.title).toBe('Beach Cleanup')
    })

    it('should return empty array when no applications', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const result = await getMyApplications()

      expect(result).toEqual([])
    })

    it('should propagate 401 error when not authenticated', async () => {
      const error = new ApiError(401, 'Unauthorized', 'Invalid token')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getMyApplications()).rejects.toThrow(error)
    })

    it('should propagate 403 error when not a volunteer', async () => {
      const error = new ApiError(403, 'Forbidden', 'Access denied')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getMyApplications()).rejects.toThrow(error)
    })
  })

  describe('getMyApplicationForOpportunity', () => {
    const mockApplication = {
      id: 1,
      status: 'PENDING',
      message: 'I would love to help!',
      appliedAt: '2024-01-15T10:00:00Z',
      opportunity: {
        id: 1,
        title: 'UA Open Day Support',
        status: 'OPEN',
        startDate: '2024-02-01T09:00:00Z',
        endDate: '2024-02-07T17:00:00Z',
        pointsReward: 50,
        location: 'University Campus',
      },
      volunteer: {
        id: 1,
        email: 'volunteer@ua.pt',
        name: 'Volunteer',
        role: 'VOLUNTEER',
        points: 0,
      },
    }

    it('should call fetch with correct endpoint and headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApplication),
      })

      await getMyApplicationForOpportunity(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/opportunities/1/my-application', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })

    it('should return ApplicationResponse when application exists', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApplication),
      })

      const result = await getMyApplicationForOpportunity(1)

      expect(result).toEqual(mockApplication)
    })

    it('should return null when response is 204 No Content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      })

      const result = await getMyApplicationForOpportunity(1)

      expect(result).toBeNull()
    })

    it('should throw ApiError when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Opportunity not found'),
      })

      await expect(getMyApplicationForOpportunity(999)).rejects.toThrow(ApiError)
    })

    it('should throw ApiError on 401 Unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid token'),
      })

      await expect(getMyApplicationForOpportunity(1)).rejects.toThrow(ApiError)
    })

    it('should throw ApiError on 403 Forbidden', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: () => Promise.resolve('Access denied'),
      })

      await expect(getMyApplicationForOpportunity(1)).rejects.toThrow(ApiError)
    })

    it('should use token from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('my-auth-token')
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      })

      await getMyApplicationForOpportunity(1)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-auth-token',
          }),
        }),
      )
    })
  })

  describe('getApprovedApplicationCount', () => {
    it('should call api.get with correct endpoint', async () => {
      vi.mocked(api.get).mockResolvedValue(5)

      const result = await getApprovedApplicationCount(1)

      expect(api.get).toHaveBeenCalledWith('/opportunities/1/application-count')
      expect(result).toBe(5)
    })

    it('should return 0 when no approved applications', async () => {
      vi.mocked(api.get).mockResolvedValue(0)

      const result = await getApprovedApplicationCount(1)

      expect(result).toBe(0)
    })

    it('should propagate 404 error when opportunity not found', async () => {
      const error = new ApiError(404, 'Not Found', 'Opportunity not found with id: 999')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getApprovedApplicationCount(999)).rejects.toThrow(error)
    })

    it('should propagate 500 error on server error', async () => {
      const error = new ApiError(500, 'Internal Server Error', 'Server error')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getApprovedApplicationCount(1)).rejects.toThrow(error)
    })
  })

  describe('parseApplicationError', () => {
    it('should parse ApiError with JSON message', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'Already applied',
      })
      const error = new ApiError(409, 'Conflict', errorBody)

      const result = await parseApplicationError(error)

      expect(result).toBe('Already applied')
    })

    it('should parse no spots available error', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 409,
        error: 'Conflict',
        message: 'No spots available',
      })
      const error = new ApiError(409, 'Conflict', errorBody)

      const result = await parseApplicationError(error)

      expect(result).toBe('No spots available')
    })

    it('should return default message when message is missing from error body', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 500,
        error: 'Internal Server Error',
      })
      const error = new ApiError(500, 'Internal Server Error', errorBody)

      const result = await parseApplicationError(error)

      expect(result).toBe('An error occurred')
    })

    it('should return error.message when JSON parsing fails', async () => {
      const error = new ApiError(400, 'Bad Request', 'Not valid JSON')

      const result = await parseApplicationError(error)

      expect(result).toBe('Not valid JSON')
    })

    it('should return error message from ApiError when JSON parsing fails on empty string', async () => {
      const error = new ApiError(500, 'Internal Server Error', '')

      const result = await parseApplicationError(error)

      expect(result).toBe('API Error: 500 Internal Server Error')
    })

    it('should return unexpected error message for non-ApiError', async () => {
      const error = new Error('Some generic error')

      const result = await parseApplicationError(error)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for unknown error types', async () => {
      const result = await parseApplicationError('string error')

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for null', async () => {
      const result = await parseApplicationError(null)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for undefined', async () => {
      const result = await parseApplicationError(undefined)

      expect(result).toBe('An unexpected error occurred')
    })
  })

  describe('getApplicationStatusColor', () => {
    it('should return yellow color for PENDING status', () => {
      const result = getApplicationStatusColor('PENDING')
      expect(result).toBe('bg-yellow-100 text-yellow-800')
    })

    it('should return green color for APPROVED status', () => {
      const result = getApplicationStatusColor('APPROVED')
      expect(result).toBe('bg-green-100 text-green-800')
    })

    it('should return red color for REJECTED status', () => {
      const result = getApplicationStatusColor('REJECTED')
      expect(result).toBe('bg-red-100 text-red-800')
    })

    it('should return blue color for COMPLETED status', () => {
      const result = getApplicationStatusColor('COMPLETED')
      expect(result).toBe('bg-blue-100 text-blue-800')
    })

    it('should return gray color for CANCELLED status', () => {
      const result = getApplicationStatusColor('CANCELLED')
      expect(result).toBe('bg-gray-100 text-gray-800')
    })

    it('should return gray color for unknown status', () => {
      const result = getApplicationStatusColor('UNKNOWN' as never)
      expect(result).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getApplicationStatusLabel', () => {
    it('should return Pending for PENDING status', () => {
      const result = getApplicationStatusLabel('PENDING')
      expect(result).toBe('Pending')
    })

    it('should return Approved for APPROVED status', () => {
      const result = getApplicationStatusLabel('APPROVED')
      expect(result).toBe('Approved')
    })

    it('should return Rejected for REJECTED status', () => {
      const result = getApplicationStatusLabel('REJECTED')
      expect(result).toBe('Rejected')
    })

    it('should return Completed for COMPLETED status', () => {
      const result = getApplicationStatusLabel('COMPLETED')
      expect(result).toBe('Completed')
    })

    it('should return Cancelled for CANCELLED status', () => {
      const result = getApplicationStatusLabel('CANCELLED')
      expect(result).toBe('Cancelled')
    })

    it('should return the status string for unknown status', () => {
      const result = getApplicationStatusLabel('UNKNOWN' as never)
      expect(result).toBe('UNKNOWN')
    })
  })
})
