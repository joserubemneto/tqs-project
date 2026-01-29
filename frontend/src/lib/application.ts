import { ApiError, api } from './api'

// ==================== Types ====================

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'

export interface OpportunitySummary {
  id: number
  title: string
  status: string
  startDate: string
  endDate: string
  pointsReward: number
  location?: string
}

export interface VolunteerResponse {
  id: number
  email: string
  name: string
  role: string
  points: number
}

export interface ApplicationResponse {
  id: number
  status: ApplicationStatus
  message?: string
  appliedAt: string
  reviewedAt?: string
  completedAt?: string
  opportunity: OpportunitySummary
  volunteer: VolunteerResponse
}

export interface CreateApplicationRequest {
  opportunityId: number
  message?: string
}

export interface ApplicationError {
  timestamp: string
  status: number
  error: string
  message: string
}

// ==================== API Functions ====================

/**
 * Apply to an opportunity (VOLUNTEER only)
 */
export async function applyToOpportunity(
  opportunityId: number,
  message?: string,
): Promise<ApplicationResponse> {
  const request: CreateApplicationRequest = {
    opportunityId,
    message,
  }
  return api.post<ApplicationResponse>('/applications', request)
}

/**
 * Get all applications submitted by the current user (VOLUNTEER only)
 */
export async function getMyApplications(): Promise<ApplicationResponse[]> {
  return api.get<ApplicationResponse[]>('/applications/my')
}

/**
 * Check if the current user has applied to a specific opportunity
 * Returns null if no application exists
 */
export async function getMyApplicationForOpportunity(
  opportunityId: number,
): Promise<ApplicationResponse | null> {
  try {
    const response = await fetch(`/api/opportunities/${opportunityId}/my-application`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    if (response.status === 204) {
      return null
    }

    if (!response.ok) {
      const message = await response.text().catch(() => undefined)
      throw new ApiError(response.status, response.statusText, message)
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError && error.status === 204) {
      return null
    }
    throw error
  }
}

/**
 * Get the count of approved applications for an opportunity (public endpoint)
 */
export async function getApprovedApplicationCount(opportunityId: number): Promise<number> {
  return api.get<number>(`/opportunities/${opportunityId}/application-count`)
}

/**
 * Get all applications for an opportunity (PROMOTER/ADMIN only)
 */
export async function getApplicationsForOpportunity(
  opportunityId: number,
): Promise<ApplicationResponse[]> {
  return api.get<ApplicationResponse[]>(`/opportunities/${opportunityId}/applications`)
}

/**
 * Approve an application (PROMOTER/ADMIN only)
 */
export async function approveApplication(applicationId: number): Promise<ApplicationResponse> {
  return api.patch<ApplicationResponse>(`/applications/${applicationId}/approve`)
}

/**
 * Reject an application (PROMOTER/ADMIN only)
 */
export async function rejectApplication(applicationId: number): Promise<ApplicationResponse> {
  return api.patch<ApplicationResponse>(`/applications/${applicationId}/reject`)
}

/**
 * Mark an approved application as completed and award points (PROMOTER/ADMIN only)
 * Can only be called after the opportunity end date has passed
 */
export async function completeApplication(applicationId: number): Promise<ApplicationResponse> {
  return api.patch<ApplicationResponse>(`/applications/${applicationId}/complete`)
}

/**
 * Parse API error response for application operations
 */
export async function parseApplicationError(error: unknown): Promise<string> {
  if (error instanceof ApiError) {
    try {
      const errorBody: ApplicationError = JSON.parse(error.message)
      return errorBody.message || 'An error occurred'
    } catch {
      return error.message || 'An error occurred'
    }
  }
  return 'An unexpected error occurred'
}

/**
 * Get the display color for an application status badge
 */
export function getApplicationStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'APPROVED':
      return 'bg-green-100 text-green-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get the display label for an application status
 */
export function getApplicationStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending'
    case 'APPROVED':
      return 'Approved'
    case 'REJECTED':
      return 'Rejected'
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}
