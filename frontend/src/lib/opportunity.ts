import { ApiError, api } from './api'
import type { UserRole } from './auth'
import type { SkillResponse } from './profile'

// ==================== Types ====================

export type OpportunityStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'FULL'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface PromoterResponse {
  id: number
  email: string
  name: string
  role: UserRole
  points: number
  createdAt: string
}

export interface OpportunityResponse {
  id: number
  title: string
  description: string
  pointsReward: number
  startDate: string
  endDate: string
  maxVolunteers: number
  status: OpportunityStatus
  location?: string
  promoter: PromoterResponse
  requiredSkills: SkillResponse[]
  createdAt: string
  updatedAt?: string
}

export interface CreateOpportunityRequest {
  title: string
  description: string
  pointsReward: number
  startDate: string // ISO format
  endDate: string // ISO format
  maxVolunteers: number
  location?: string
  requiredSkillIds: number[]
}

export interface OpportunityError {
  timestamp: string
  status: number
  error: string
  message: string
  validationErrors?: Record<string, string>
}

export interface OpportunityPageResponse {
  content: OpportunityResponse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface GetOpportunitiesParams {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
}

// ==================== API Functions ====================

/**
 * Get all open opportunities (public endpoint)
 */
export async function getOpportunities(
  params?: GetOpportunitiesParams,
): Promise<OpportunityPageResponse> {
  return api.get<OpportunityPageResponse>('/opportunities', {
    params: params
      ? {
          page: params.page,
          size: params.size,
          sortBy: params.sortBy,
          sortDir: params.sortDir,
        }
      : undefined,
  })
}

/**
 * Create a new volunteering opportunity
 */
export async function createOpportunity(
  data: CreateOpportunityRequest,
): Promise<OpportunityResponse> {
  return api.post<OpportunityResponse>('/opportunities', data)
}

/**
 * Get all opportunities created by the current promoter
 */
export async function getMyOpportunities(): Promise<OpportunityResponse[]> {
  return api.get<OpportunityResponse[]>('/opportunities/my')
}

/**
 * Parse API error response for opportunity operations
 */
export async function parseOpportunityError(error: unknown): Promise<string> {
  if (error instanceof ApiError) {
    try {
      const errorBody: OpportunityError = JSON.parse(error.message)
      return errorBody.message || 'An error occurred'
    } catch {
      return error.message || 'An error occurred'
    }
  }
  return 'An unexpected error occurred'
}
