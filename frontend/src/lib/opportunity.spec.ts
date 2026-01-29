import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import {
  createOpportunity,
  getMyOpportunities,
  getOpportunities,
  parseOpportunityError,
} from './opportunity'

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

import { api } from './api'

describe('opportunity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getOpportunities', () => {
    const mockOpportunity = {
      id: 1,
      title: 'UA Open Day Support',
      description: 'Help with university open day activities',
      pointsReward: 50,
      startDate: '2024-02-01T09:00:00Z',
      endDate: '2024-02-07T17:00:00Z',
      maxVolunteers: 10,
      status: 'OPEN',
      location: 'University Campus',
      promoter: {
        id: 1,
        email: 'promoter@ua.pt',
        name: 'Promoter User',
        role: 'PROMOTER',
        points: 0,
        createdAt: '2024-01-01T00:00:00Z',
      },
      requiredSkills: [
        {
          id: 1,
          name: 'Communication',
          category: 'COMMUNICATION',
          description: 'Effective communication skills',
        },
      ],
      createdAt: '2024-01-15T00:00:00Z',
    }

    const mockPageResponse = {
      content: [mockOpportunity],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    }

    it('should call api.get with correct endpoint without params', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      const result = await getOpportunities()

      expect(api.get).toHaveBeenCalledWith('/opportunities', {
        params: undefined,
      })
      expect(result).toEqual(mockPageResponse)
    })

    it('should call api.get with pagination params', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      await getOpportunities({ page: 2, size: 20 })

      expect(api.get).toHaveBeenCalledWith('/opportunities', {
        params: {
          page: 2,
          size: 20,
          sortBy: undefined,
          sortDir: undefined,
        },
      })
    })

    it('should call api.get with sorting params', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      await getOpportunities({ sortBy: 'startDate', sortDir: 'desc' })

      expect(api.get).toHaveBeenCalledWith('/opportunities', {
        params: {
          page: undefined,
          size: undefined,
          sortBy: 'startDate',
          sortDir: 'desc',
        },
      })
    })

    it('should call api.get with all params', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      await getOpportunities({
        page: 1,
        size: 15,
        sortBy: 'title',
        sortDir: 'asc',
      })

      expect(api.get).toHaveBeenCalledWith('/opportunities', {
        params: {
          page: 1,
          size: 15,
          sortBy: 'title',
          sortDir: 'asc',
        },
      })
    })

    it('should return OpportunityPageResponse with all fields', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      const result = await getOpportunities()

      expect(result.content).toHaveLength(1)
      expect(result.totalElements).toBe(1)
      expect(result.totalPages).toBe(1)
      expect(result.size).toBe(10)
      expect(result.number).toBe(0)
    })

    it('should return opportunity with all details', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      const result = await getOpportunities()

      const opportunity = result.content[0]
      expect(opportunity.id).toBe(1)
      expect(opportunity.title).toBe('UA Open Day Support')
      expect(opportunity.description).toBe('Help with university open day activities')
      expect(opportunity.pointsReward).toBe(50)
      expect(opportunity.maxVolunteers).toBe(10)
      expect(opportunity.status).toBe('OPEN')
      expect(opportunity.location).toBe('University Campus')
      expect(opportunity.promoter.email).toBe('promoter@ua.pt')
      expect(opportunity.requiredSkills).toHaveLength(1)
    })

    it('should return empty page when no opportunities', async () => {
      const emptyResponse = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      }
      vi.mocked(api.get).mockResolvedValue(emptyResponse)

      const result = await getOpportunities()

      expect(result.content).toEqual([])
      expect(result.totalElements).toBe(0)
    })

    it('should propagate errors from api.get', async () => {
      const error = new ApiError(500, 'Internal Server Error', 'Server error')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getOpportunities()).rejects.toThrow(error)
    })
  })

  describe('createOpportunity', () => {
    const mockRequest = {
      title: 'UA Open Day Support',
      description: 'Help with university open day activities',
      pointsReward: 50,
      startDate: '2024-02-01T09:00:00Z',
      endDate: '2024-02-07T17:00:00Z',
      maxVolunteers: 10,
      location: 'University Campus',
      requiredSkillIds: [1, 2],
    }

    const mockResponse = {
      id: 1,
      title: 'UA Open Day Support',
      description: 'Help with university open day activities',
      pointsReward: 50,
      startDate: '2024-02-01T09:00:00Z',
      endDate: '2024-02-07T17:00:00Z',
      maxVolunteers: 10,
      status: 'DRAFT',
      location: 'University Campus',
      promoter: {
        id: 1,
        email: 'promoter@ua.pt',
        name: 'Promoter User',
        role: 'PROMOTER',
        points: 0,
        createdAt: '2024-01-01T00:00:00Z',
      },
      requiredSkills: [
        { id: 1, name: 'Communication', category: 'COMMUNICATION' },
        { id: 2, name: 'Leadership', category: 'LEADERSHIP' },
      ],
      createdAt: '2024-01-15T00:00:00Z',
    }

    it('should call api.post with correct endpoint and data', async () => {
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await createOpportunity(mockRequest)

      expect(api.post).toHaveBeenCalledWith('/opportunities', mockRequest)
      expect(result).toEqual(mockResponse)
    })

    it('should return OpportunityResponse with all fields', async () => {
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await createOpportunity(mockRequest)

      expect(result.id).toBe(1)
      expect(result.title).toBe('UA Open Day Support')
      expect(result.description).toBe('Help with university open day activities')
      expect(result.pointsReward).toBe(50)
      expect(result.maxVolunteers).toBe(10)
      expect(result.status).toBe('DRAFT')
      expect(result.location).toBe('University Campus')
      expect(result.promoter).toBeDefined()
      expect(result.requiredSkills).toHaveLength(2)
    })

    it('should create opportunity without location', async () => {
      const requestWithoutLocation = {
        ...mockRequest,
        location: undefined,
      }
      const responseWithoutLocation = {
        ...mockResponse,
        location: undefined,
      }
      vi.mocked(api.post).mockResolvedValue(responseWithoutLocation)

      const result = await createOpportunity(requestWithoutLocation)

      expect(result.location).toBeUndefined()
    })

    it('should propagate validation errors from api.post', async () => {
      const error = new ApiError(400, 'Bad Request', 'Title is required')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(createOpportunity(mockRequest)).rejects.toThrow(error)
    })

    it('should propagate 401 error when not authenticated', async () => {
      const error = new ApiError(401, 'Unauthorized', 'Invalid token')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(createOpportunity(mockRequest)).rejects.toThrow(error)
    })

    it('should propagate 403 error when not authorized', async () => {
      const error = new ApiError(403, 'Forbidden', 'Access denied')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(createOpportunity(mockRequest)).rejects.toThrow(error)
    })
  })

  describe('getMyOpportunities', () => {
    const mockOpportunities = [
      {
        id: 1,
        title: 'My First Opportunity',
        description: 'Description 1',
        pointsReward: 50,
        startDate: '2024-02-01T09:00:00Z',
        endDate: '2024-02-07T17:00:00Z',
        maxVolunteers: 10,
        status: 'DRAFT',
        location: 'Location 1',
        promoter: {
          id: 1,
          email: 'promoter@ua.pt',
          name: 'Promoter',
          role: 'PROMOTER',
          points: 0,
          createdAt: '2024-01-01T00:00:00Z',
        },
        requiredSkills: [],
        createdAt: '2024-01-15T00:00:00Z',
      },
      {
        id: 2,
        title: 'My Second Opportunity',
        description: 'Description 2',
        pointsReward: 30,
        startDate: '2024-03-01T09:00:00Z',
        endDate: '2024-03-07T17:00:00Z',
        maxVolunteers: 5,
        status: 'OPEN',
        location: 'Location 2',
        promoter: {
          id: 1,
          email: 'promoter@ua.pt',
          name: 'Promoter',
          role: 'PROMOTER',
          points: 0,
          createdAt: '2024-01-01T00:00:00Z',
        },
        requiredSkills: [],
        createdAt: '2024-01-20T00:00:00Z',
      },
    ]

    it('should call api.get with correct endpoint', async () => {
      vi.mocked(api.get).mockResolvedValue(mockOpportunities)

      const result = await getMyOpportunities()

      expect(api.get).toHaveBeenCalledWith('/opportunities/my')
      expect(result).toEqual(mockOpportunities)
    })

    it('should return array of OpportunityResponse', async () => {
      vi.mocked(api.get).mockResolvedValue(mockOpportunities)

      const result = await getMyOpportunities()

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('My First Opportunity')
      expect(result[1].title).toBe('My Second Opportunity')
    })

    it('should return empty array when no opportunities', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const result = await getMyOpportunities()

      expect(result).toEqual([])
    })

    it('should propagate 401 error when not authenticated', async () => {
      const error = new ApiError(401, 'Unauthorized', 'Invalid token')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getMyOpportunities()).rejects.toThrow(error)
    })

    it('should propagate 403 error when not a promoter', async () => {
      const error = new ApiError(403, 'Forbidden', 'Access denied')
      vi.mocked(api.get).mockRejectedValue(error)

      await expect(getMyOpportunities()).rejects.toThrow(error)
    })
  })

  describe('parseOpportunityError', () => {
    it('should parse ApiError with JSON message', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Title is required',
      })
      const error = new ApiError(400, 'Bad Request', errorBody)

      const result = await parseOpportunityError(error)

      expect(result).toBe('Title is required')
    })

    it('should return default message when message is missing from error body', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 500,
        error: 'Internal Server Error',
      })
      const error = new ApiError(500, 'Internal Server Error', errorBody)

      const result = await parseOpportunityError(error)

      expect(result).toBe('An error occurred')
    })

    it('should return error.message when JSON parsing fails', async () => {
      const error = new ApiError(400, 'Bad Request', 'Not valid JSON')

      const result = await parseOpportunityError(error)

      expect(result).toBe('Not valid JSON')
    })

    it('should return error message from ApiError when JSON parsing fails on empty string', async () => {
      const error = new ApiError(500, 'Internal Server Error', '')

      const result = await parseOpportunityError(error)

      expect(result).toBe('API Error: 500 Internal Server Error')
    })

    it('should return unexpected error message for non-ApiError', async () => {
      const error = new Error('Some generic error')

      const result = await parseOpportunityError(error)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for unknown error types', async () => {
      const result = await parseOpportunityError('string error')

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for null', async () => {
      const result = await parseOpportunityError(null)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should return unexpected error message for undefined', async () => {
      const result = await parseOpportunityError(undefined)

      expect(result).toBe('An unexpected error occurred')
    })

    it('should handle validation errors in response', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        validationErrors: {
          title: 'Title is required',
          description: 'Description is required',
        },
      })
      const error = new ApiError(400, 'Bad Request', errorBody)

      const result = await parseOpportunityError(error)

      expect(result).toBe('Validation failed')
    })

    it('should handle end date before start date error', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'End date must be after start date',
      })
      const error = new ApiError(400, 'Bad Request', errorBody)

      const result = await parseOpportunityError(error)

      expect(result).toBe('End date must be after start date')
    })

    it('should handle skill not found error', async () => {
      const errorBody = JSON.stringify({
        timestamp: '2024-01-01T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Skill not found with id: 999',
      })
      const error = new ApiError(400, 'Bad Request', errorBody)

      const result = await parseOpportunityError(error)

      expect(result).toBe('Skill not found with id: 999')
    })
  })
})
