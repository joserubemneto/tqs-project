import { ApiError, api } from './api'
import type { UserRole } from './auth'

// ==================== Types ====================

export type SkillCategory =
  | 'TECHNICAL'
  | 'COMMUNICATION'
  | 'LEADERSHIP'
  | 'CREATIVE'
  | 'ADMINISTRATIVE'
  | 'SOCIAL'
  | 'LANGUAGE'
  | 'OTHER'

export interface SkillResponse {
  id: number
  name: string
  category: SkillCategory
  description?: string
}

export interface ProfileResponse {
  id: number
  email: string
  name: string
  role: UserRole
  points: number
  bio?: string
  skills: SkillResponse[]
  createdAt: string
  updatedAt?: string
}

export interface UpdateProfileRequest {
  name: string
  bio?: string
  skillIds: number[]
}

export interface ProfileError {
  timestamp: string
  status: number
  error: string
  message: string
  validationErrors?: Record<string, string>
}

// ==================== API Functions ====================

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<ProfileResponse> {
  return api.get<ProfileResponse>('/profile')
}

/**
 * Update the current user's profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
  return api.put<ProfileResponse>('/profile', data)
}

/**
 * Get all available skills
 */
export async function getSkills(category?: SkillCategory): Promise<SkillResponse[]> {
  return api.get<SkillResponse[]>('/skills', {
    params: category ? { category } : undefined,
  })
}

/**
 * Parse API error response for profile operations
 */
export async function parseProfileError(error: unknown): Promise<string> {
  if (error instanceof ApiError) {
    try {
      const errorBody: ProfileError = JSON.parse(error.message)
      return errorBody.message || 'An error occurred'
    } catch {
      return error.message || 'An error occurred'
    }
  }
  return 'An unexpected error occurred'
}

// ==================== Skill Utilities ====================

/**
 * Human-readable labels for skill categories
 */
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  TECHNICAL: 'Technical',
  COMMUNICATION: 'Communication',
  LEADERSHIP: 'Leadership',
  CREATIVE: 'Creative',
  ADMINISTRATIVE: 'Administrative',
  SOCIAL: 'Social',
  LANGUAGE: 'Language',
  OTHER: 'Other',
}

/**
 * Group skills by their category
 */
export function groupSkillsByCategory(
  skills: SkillResponse[],
): Record<SkillCategory, SkillResponse[]> {
  return skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    },
    {} as Record<SkillCategory, SkillResponse[]>,
  )
}
