import { api } from './api'

// ==================== Types ====================

export type RewardType = 'UA_SERVICE' | 'PARTNER_VOUCHER' | 'MERCHANDISE' | 'CERTIFICATE' | 'OTHER'

export interface PartnerResponse {
  id: number
  name: string
  description?: string
  logoUrl?: string
  website?: string
  active: boolean
  createdAt: string
}

export interface RewardResponse {
  id: number
  title: string
  description: string
  pointsCost: number
  type: RewardType
  partner?: PartnerResponse
  quantity?: number
  remainingQuantity?: number
  active: boolean
  availableFrom?: string
  availableUntil?: string
  createdAt: string
}

export interface CreateRewardRequest {
  title: string
  description: string
  pointsCost: number
  type: RewardType
  partnerId?: number
  quantity?: number
  availableFrom?: string
  availableUntil?: string
}

export interface UpdateRewardRequest {
  title?: string
  description?: string
  pointsCost?: number
  type?: RewardType
  partnerId?: number
  quantity?: number
  availableFrom?: string
  availableUntil?: string
  active?: boolean
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ==================== API Functions ====================

/**
 * Get all available rewards (public endpoint)
 */
export async function getAvailableRewards(): Promise<RewardResponse[]> {
  return api.get<RewardResponse[]>('/rewards')
}

/**
 * Get a single reward by ID (public endpoint)
 */
export async function getReward(id: number): Promise<RewardResponse> {
  return api.get<RewardResponse>(`/rewards/${id}`)
}

/**
 * Get all rewards with pagination (admin only)
 */
export async function getRewards(
  page: number = 0,
  size: number = 10,
  sortBy: string = 'createdAt',
  sortDir: string = 'desc',
): Promise<PageResponse<RewardResponse>> {
  return api.get<PageResponse<RewardResponse>>('/admin/rewards', {
    params: { page, size, sortBy, sortDir },
  })
}

/**
 * Create a new reward (admin only)
 */
export async function createReward(request: CreateRewardRequest): Promise<RewardResponse> {
  return api.post<RewardResponse>('/admin/rewards', request)
}

/**
 * Update an existing reward (admin only)
 */
export async function updateReward(
  id: number,
  request: UpdateRewardRequest,
): Promise<RewardResponse> {
  return api.put<RewardResponse>(`/admin/rewards/${id}`, request)
}

/**
 * Deactivate a reward (admin only)
 */
export async function deleteReward(id: number): Promise<void> {
  return api.delete(`/admin/rewards/${id}`)
}

// ==================== Redemption Types ====================

export interface RedemptionResponse {
  id: number
  code: string
  pointsSpent: number
  redeemedAt: string
  usedAt?: string
  reward: {
    id: number
    title: string
    type: RewardType
    partnerName?: string
  }
}

// ==================== Redemption API Functions ====================

/**
 * Redeem a reward (volunteer only)
 */
export async function redeemReward(rewardId: number): Promise<RedemptionResponse> {
  return api.post<RedemptionResponse>(`/redemptions/rewards/${rewardId}`, {})
}

/**
 * Get all redemptions for the current user (volunteer only)
 */
export async function getMyRedemptions(): Promise<RedemptionResponse[]> {
  return api.get<RedemptionResponse[]>('/redemptions/my')
}

// ==================== Utility Functions ====================

/**
 * Get color classes for reward type badge
 */
export function getRewardTypeColor(type: RewardType): string {
  const colors: Record<RewardType, string> = {
    UA_SERVICE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    PARTNER_VOUCHER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    MERCHANDISE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    CERTIFICATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  }
  return colors[type] || colors.OTHER
}

/**
 * Get human-readable label for reward type
 */
export function getRewardTypeLabel(type: RewardType): string {
  const labels: Record<RewardType, string> = {
    UA_SERVICE: 'UA Service',
    PARTNER_VOUCHER: 'Partner Voucher',
    MERCHANDISE: 'Merchandise',
    CERTIFICATE: 'Certificate',
    OTHER: 'Other',
  }
  return labels[type] || type
}

/**
 * Check if a reward is available (has remaining quantity or unlimited)
 */
export function isRewardAvailable(reward: RewardResponse): boolean {
  if (!reward.active) return false
  if (reward.remainingQuantity === null || reward.remainingQuantity === undefined) return true
  return reward.remainingQuantity > 0
}

/**
 * Format availability text for a reward
 */
export function getAvailabilityText(reward: RewardResponse): string {
  if (reward.remainingQuantity === null || reward.remainingQuantity === undefined) {
    return 'Unlimited'
  }
  if (reward.remainingQuantity === 0) {
    return 'Out of stock'
  }
  return `${reward.remainingQuantity} remaining`
}
