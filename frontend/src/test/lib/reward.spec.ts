import { describe, expect, it } from 'vitest'
import {
  getAvailabilityText,
  getRewardTypeColor,
  getRewardTypeLabel,
  isRewardAvailable,
  type RewardResponse,
} from '@/lib/reward'

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
  })
})
