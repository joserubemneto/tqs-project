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

/**
 * Data for updating an existing opportunity.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateOpportunityData {
  title?: string
  description?: string
  pointsReward?: number
  startDate?: string // ISO format
  endDate?: string // ISO format
  maxVolunteers?: number
  location?: string
  requiredSkillIds?: number[]
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

export interface OpportunityFilters {
  skillIds?: number[]
  startDateFrom?: string // ISO format
  startDateTo?: string // ISO format
  minPoints?: number
  maxPoints?: number
}

export interface GetOpportunitiesParams extends OpportunityFilters {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
}

export interface AdminOpportunitiesParams {
  page?: number
  size?: number
  status?: OpportunityStatus
  sortBy?: string
  sortDir?: string
}

// ==================== API Functions ====================

/**
 * Get all open opportunities with optional filters (public endpoint)
 */
export async function getOpportunities(
  params?: GetOpportunitiesParams,
): Promise<OpportunityPageResponse> {
  if (!params) {
    return api.get<OpportunityPageResponse>('/opportunities')
  }

  // Build query params, only including defined values
  const queryParams: Record<string, string | number | undefined> = {
    page: params.page,
    size: params.size,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    minPoints: params.minPoints,
    maxPoints: params.maxPoints,
    startDateFrom: params.startDateFrom,
    startDateTo: params.startDateTo,
  }

  // Handle skillIds array (Spring expects comma-separated or multiple params)
  if (params.skillIds && params.skillIds.length > 0) {
    ;(queryParams as Record<string, unknown>).skillIds = params.skillIds
  }

  return api.get<OpportunityPageResponse>('/opportunities', {
    params: queryParams,
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
 * Get a single opportunity by ID (public endpoint)
 */
export async function getOpportunityById(id: number): Promise<OpportunityResponse> {
  return api.get<OpportunityResponse>(`/opportunities/${id}`)
}

/**
 * Update an existing opportunity (owner or admin only)
 */
export async function updateOpportunity(
  id: number,
  data: UpdateOpportunityData,
): Promise<OpportunityResponse> {
  return api.put<OpportunityResponse>(`/opportunities/${id}`, data)
}

/**
 * Cancel an opportunity (owner or admin only)
 */
export async function cancelOpportunity(id: number): Promise<OpportunityResponse> {
  return api.post<OpportunityResponse>(`/opportunities/${id}/cancel`, {})
}

/**
 * Publish a DRAFT opportunity to make it visible (owner or admin only)
 */
export async function publishOpportunity(id: number): Promise<OpportunityResponse> {
  return api.post<OpportunityResponse>(`/opportunities/${id}/publish`, {})
}

/**
 * Get all opportunities for admin view with optional status filter (admin only)
 */
export async function getAdminOpportunities(
  params?: AdminOpportunitiesParams,
): Promise<OpportunityPageResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    page: params?.page,
    size: params?.size,
    status: params?.status,
    sortBy: params?.sortBy,
    sortDir: params?.sortDir,
  }

  return api.get<OpportunityPageResponse>('/admin/opportunities', {
    params: queryParams,
  })
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
