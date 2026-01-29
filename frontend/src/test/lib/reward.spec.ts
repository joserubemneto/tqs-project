import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import {
  createReward,
  deleteReward,
  getAvailabilityText,
  getAvailableRewards,
  getMyRedemptions,
  getReward,
  getRewards,
  getRewardTypeColor,
  getRewardTypeLabel,
  isRewardAvailable,
  type RewardResponse,
  redeemReward,
  updateReward,
} from '@/lib/reward'

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('reward utilities', () => {
  describe('getRewardTypeColor', () => {
    it('should return correct color for UA_SERVICE', () => {
      expect(getRewardTypeColor('UA_SERVICE')).toContain('blue')
    })

    it('should return correct color for PARTNER_VOUCHER', () => {
      expect(getRewardTypeColor('PARTNER_VOUCHER')).toContain('purple')
    })

    it('should return correct color for MERCHANDISE', () => {
      expect(getRewardTypeColor('MERCHANDISE')).toContain('green')
    })

    it('should return correct color for CERTIFICATE', () => {
      expect(getRewardTypeColor('CERTIFICATE')).toContain('yellow')
    })

    it('should return correct color for OTHER', () => {
      expect(getRewardTypeColor('OTHER')).toContain('gray')
    })
  })

  describe('getRewardTypeLabel', () => {
    it('should return correct label for UA_SERVICE', () => {
      expect(getRewardTypeLabel('UA_SERVICE')).toBe('UA Service')
    })

    it('should return correct label for PARTNER_VOUCHER', () => {
      expect(getRewardTypeLabel('PARTNER_VOUCHER')).toBe('Partner Voucher')
    })

    it('should return correct label for MERCHANDISE', () => {
      expect(getRewardTypeLabel('MERCHANDISE')).toBe('Merchandise')
    })

    it('should return correct label for CERTIFICATE', () => {
      expect(getRewardTypeLabel('CERTIFICATE')).toBe('Certificate')
    })

    it('should return correct label for OTHER', () => {
      expect(getRewardTypeLabel('OTHER')).toBe('Other')
    })
  })

  describe('isRewardAvailable', () => {
    const baseReward: RewardResponse = {
      id: 1,
      title: 'Test Reward',
      description: 'Test description',
      pointsCost: 50,
      type: 'CERTIFICATE',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
    }

    it('should return false for inactive reward', () => {
      const reward = { ...baseReward, active: false }
      expect(isRewardAvailable(reward)).toBe(false)
    })

    it('should return true for active reward with no quantity limit', () => {
      const reward = { ...baseReward, remainingQuantity: undefined }
      expect(isRewardAvailable(reward)).toBe(true)
    })

    it('should return true for active reward with remaining quantity', () => {
      const reward = { ...baseReward, remainingQuantity: 10 }
      expect(isRewardAvailable(reward)).toBe(true)
    })

    it('should return false for active reward with zero remaining quantity', () => {
      const reward = { ...baseReward, remainingQuantity: 0 }
      expect(isRewardAvailable(reward)).toBe(false)
    })
  })

  describe('getAvailabilityText', () => {
    const baseReward: RewardResponse = {
      id: 1,
      title: 'Test Reward',
      description: 'Test description',
      pointsCost: 50,
      type: 'CERTIFICATE',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
    }

    it('should return "Unlimited" for reward with no quantity limit', () => {
      const reward = { ...baseReward, remainingQuantity: undefined }
      expect(getAvailabilityText(reward)).toBe('Unlimited')
    })

    it('should return "Out of stock" for reward with zero remaining', () => {
      const reward = { ...baseReward, remainingQuantity: 0 }
      expect(getAvailabilityText(reward)).toBe('Out of stock')
    })

    it('should return remaining count for reward with quantity', () => {
      const reward = { ...baseReward, remainingQuantity: 15 }
      expect(getAvailabilityText(reward)).toBe('15 remaining')
    })

    it('should return "Unlimited" for reward with null remaining quantity', () => {
      const reward = { ...baseReward, remainingQuantity: null as unknown as undefined }
      expect(getAvailabilityText(reward)).toBe('Unlimited')
    })
  })

  describe('isRewardAvailable edge cases', () => {
    const baseReward: RewardResponse = {
      id: 1,
      title: 'Test Reward',
      description: 'Test description',
      pointsCost: 50,
      type: 'CERTIFICATE',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
    }

    it('should return true for active reward with null remaining quantity', () => {
      const reward = { ...baseReward, remainingQuantity: null as unknown as undefined }
      expect(isRewardAvailable(reward)).toBe(true)
    })
  })

  describe('getRewardTypeColor edge cases', () => {
    it('should return OTHER color for unknown type', () => {
      const unknownType = 'UNKNOWN' as 'OTHER'
      expect(getRewardTypeColor(unknownType)).toContain('gray')
    })
  })

  describe('getRewardTypeLabel edge cases', () => {
    it('should return the type itself for unknown type', () => {
      const unknownType = 'UNKNOWN_TYPE' as 'OTHER'
      // When type is not in the map, it returns the type itself
      const result = getRewardTypeLabel(unknownType)
      expect(result).toBe('UNKNOWN_TYPE')
    })
  })
})

describe('reward API functions', () => {
  const mockReward: RewardResponse = {
    id: 1,
    title: 'Free Coffee',
    description: 'Get a free coffee',
    pointsCost: 50,
    type: 'PARTNER_VOUCHER',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  }

  const mockPageResponse = {
    content: [mockReward],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAvailableRewards', () => {
    it('should call api.get with correct path', async () => {
      vi.mocked(api.get).mockResolvedValue([mockReward])

      const result = await getAvailableRewards()

      expect(api.get).toHaveBeenCalledWith('/rewards')
      expect(result).toEqual([mockReward])
    })

    it('should return empty array when no rewards', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const result = await getAvailableRewards()

      expect(result).toEqual([])
    })
  })

  describe('getReward', () => {
    it('should call api.get with correct path including id', async () => {
      vi.mocked(api.get).mockResolvedValue(mockReward)

      const result = await getReward(1)

      expect(api.get).toHaveBeenCalledWith('/rewards/1')
      expect(result).toEqual(mockReward)
    })

    it('should handle different reward IDs', async () => {
      vi.mocked(api.get).mockResolvedValue(mockReward)

      await getReward(42)

      expect(api.get).toHaveBeenCalledWith('/rewards/42')
    })
  })

  describe('getRewards', () => {
    it('should call api.get with default parameters', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      const result = await getRewards()

      expect(api.get).toHaveBeenCalledWith('/admin/rewards', {
        params: { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' },
      })
      expect(result).toEqual(mockPageResponse)
    })

    it('should call api.get with custom parameters', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      await getRewards(2, 20, 'title', 'asc')

      expect(api.get).toHaveBeenCalledWith('/admin/rewards', {
        params: { page: 2, size: 20, sortBy: 'title', sortDir: 'asc' },
      })
    })

    it('should handle partial parameters', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPageResponse)

      await getRewards(1, 5)

      expect(api.get).toHaveBeenCalledWith('/admin/rewards', {
        params: { page: 1, size: 5, sortBy: 'createdAt', sortDir: 'desc' },
      })
    })
  })

  describe('createReward', () => {
    it('should call api.post with correct path and data', async () => {
      const createRequest = {
        title: 'New Reward',
        description: 'A new reward',
        pointsCost: 75,
        type: 'CERTIFICATE' as const,
      }
      vi.mocked(api.post).mockResolvedValue(mockReward)

      const result = await createReward(createRequest)

      expect(api.post).toHaveBeenCalledWith('/admin/rewards', createRequest)
      expect(result).toEqual(mockReward)
    })

    it('should handle request with optional fields', async () => {
      const createRequest = {
        title: 'Partner Reward',
        description: 'With partner',
        pointsCost: 100,
        type: 'PARTNER_VOUCHER' as const,
        partnerId: 5,
        quantity: 50,
        availableFrom: '2024-01-01T00:00:00Z',
        availableUntil: '2024-12-31T23:59:59Z',
      }
      vi.mocked(api.post).mockResolvedValue(mockReward)

      await createReward(createRequest)

      expect(api.post).toHaveBeenCalledWith('/admin/rewards', createRequest)
    })
  })

  describe('updateReward', () => {
    it('should call api.put with correct path and data', async () => {
      const updateRequest = {
        title: 'Updated Reward',
        pointsCost: 100,
      }
      vi.mocked(api.put).mockResolvedValue(mockReward)

      const result = await updateReward(1, updateRequest)

      expect(api.put).toHaveBeenCalledWith('/admin/rewards/1', updateRequest)
      expect(result).toEqual(mockReward)
    })

    it('should handle update with active field', async () => {
      const updateRequest = {
        active: false,
      }
      vi.mocked(api.put).mockResolvedValue({ ...mockReward, active: false })

      await updateReward(42, updateRequest)

      expect(api.put).toHaveBeenCalledWith('/admin/rewards/42', updateRequest)
    })
  })

  describe('deleteReward', () => {
    it('should call api.delete with correct path', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined)

      await deleteReward(1)

      expect(api.delete).toHaveBeenCalledWith('/admin/rewards/1')
    })

    it('should handle different reward IDs', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined)

      await deleteReward(99)

      expect(api.delete).toHaveBeenCalledWith('/admin/rewards/99')
    })
  })

  describe('redeemReward', () => {
    const mockRedemptionResponse = {
      id: 1,
      code: 'ABC123XYZ',
      pointsSpent: 50,
      redeemedAt: '2024-01-15T10:00:00Z',
      reward: {
        id: 1,
        title: 'Free Coffee',
        type: 'PARTNER_VOUCHER' as const,
        partnerName: 'UA Cafeteria',
      },
    }

    it('should call api.post with correct path', async () => {
      vi.mocked(api.post).mockResolvedValue(mockRedemptionResponse)

      const result = await redeemReward(1)

      expect(api.post).toHaveBeenCalledWith('/redemptions/rewards/1', {})
      expect(result).toEqual(mockRedemptionResponse)
    })

    it('should return redemption response with code', async () => {
      vi.mocked(api.post).mockResolvedValue(mockRedemptionResponse)

      const result = await redeemReward(1)

      expect(result.code).toBe('ABC123XYZ')
      expect(result.pointsSpent).toBe(50)
      expect(result.reward.title).toBe('Free Coffee')
    })

    it('should handle different reward IDs', async () => {
      vi.mocked(api.post).mockResolvedValue(mockRedemptionResponse)

      await redeemReward(42)

      expect(api.post).toHaveBeenCalledWith('/redemptions/rewards/42', {})
    })

    it('should propagate error when user has insufficient points', async () => {
      const error = new Error('Insufficient points')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(redeemReward(1)).rejects.toThrow('Insufficient points')
    })

    it('should propagate error when reward is not available', async () => {
      const error = new Error('Reward not available')
      vi.mocked(api.post).mockRejectedValue(error)

      await expect(redeemReward(1)).rejects.toThrow('Reward not available')
    })
  })

  describe('getMyRedemptions', () => {
    const mockRedemptions = [
      {
        id: 1,
        code: 'ABC123',
        pointsSpent: 50,
        redeemedAt: '2024-01-15T10:00:00Z',
        reward: {
          id: 1,
          title: 'Free Coffee',
          type: 'PARTNER_VOUCHER' as const,
          partnerName: 'UA Cafeteria',
        },
      },
      {
        id: 2,
        code: 'DEF456',
        pointsSpent: 100,
        redeemedAt: '2024-01-16T14:00:00Z',
        usedAt: '2024-01-17T09:00:00Z',
        reward: {
          id: 2,
          title: 'Library Pass',
          type: 'UA_SERVICE' as const,
        },
      },
    ]

    it('should call api.get with correct path', async () => {
      vi.mocked(api.get).mockResolvedValue(mockRedemptions)

      const result = await getMyRedemptions()

      expect(api.get).toHaveBeenCalledWith('/redemptions/my')
      expect(result).toEqual(mockRedemptions)
    })

    it('should return array of redemptions', async () => {
      vi.mocked(api.get).mockResolvedValue(mockRedemptions)

      const result = await getMyRedemptions()

      expect(result).toHaveLength(2)
      expect(result[0].code).toBe('ABC123')
      expect(result[1].code).toBe('DEF456')
    })

    it('should return empty array when no redemptions', async () => {
      vi.mocked(api.get).mockResolvedValue([])

      const result = await getMyRedemptions()

      expect(result).toEqual([])
    })

    it('should include usedAt when redemption has been used', async () => {
      vi.mocked(api.get).mockResolvedValue(mockRedemptions)

      const result = await getMyRedemptions()

      expect(result[0].usedAt).toBeUndefined()
      expect(result[1].usedAt).toBe('2024-01-17T09:00:00Z')
    })
  })
})
