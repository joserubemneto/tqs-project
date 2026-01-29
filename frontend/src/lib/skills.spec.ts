import { describe, expect, it } from 'vitest'
import type { SkillResponse } from './profile'
import { groupSkillsByCategory, SKILL_CATEGORY_LABELS, toggleSkillId } from './skills'

describe('skills utilities', () => {
  describe('SKILL_CATEGORY_LABELS', () => {
    it('should have labels for all skill categories', () => {
      expect(SKILL_CATEGORY_LABELS.TECHNICAL).toBe('Technical')
      expect(SKILL_CATEGORY_LABELS.COMMUNICATION).toBe('Communication')
      expect(SKILL_CATEGORY_LABELS.LEADERSHIP).toBe('Leadership')
      expect(SKILL_CATEGORY_LABELS.CREATIVE).toBe('Creative')
      expect(SKILL_CATEGORY_LABELS.ADMINISTRATIVE).toBe('Administrative')
      expect(SKILL_CATEGORY_LABELS.SOCIAL).toBe('Social')
      expect(SKILL_CATEGORY_LABELS.LANGUAGE).toBe('Language')
      expect(SKILL_CATEGORY_LABELS.OTHER).toBe('Other')
    })

    it('should have exactly 8 categories', () => {
      expect(Object.keys(SKILL_CATEGORY_LABELS)).toHaveLength(8)
    })
  })

  describe('groupSkillsByCategory', () => {
    it('should return empty object for empty skills array', () => {
      const result = groupSkillsByCategory([])
      expect(result).toEqual({})
    })

    it('should group skills by their category', () => {
      const skills: SkillResponse[] = [
        { id: 1, name: 'Programming', category: 'TECHNICAL' },
        { id: 2, name: 'Communication', category: 'COMMUNICATION' },
        { id: 3, name: 'Web Development', category: 'TECHNICAL' },
        { id: 4, name: 'Leadership', category: 'LEADERSHIP' },
      ]

      const result = groupSkillsByCategory(skills)

      expect(Object.keys(result)).toHaveLength(3)
      expect(result.TECHNICAL).toHaveLength(2)
      expect(result.COMMUNICATION).toHaveLength(1)
      expect(result.LEADERSHIP).toHaveLength(1)
    })

    it('should preserve skill properties in grouped results', () => {
      const skills: SkillResponse[] = [
        { id: 1, name: 'Programming', category: 'TECHNICAL', description: 'Coding skills' },
        { id: 2, name: 'Data Analysis', category: 'TECHNICAL', description: 'Data skills' },
      ]

      const result = groupSkillsByCategory(skills)

      expect(result.TECHNICAL[0]).toEqual({
        id: 1,
        name: 'Programming',
        category: 'TECHNICAL',
        description: 'Coding skills',
      })
      expect(result.TECHNICAL[1]).toEqual({
        id: 2,
        name: 'Data Analysis',
        category: 'TECHNICAL',
        description: 'Data skills',
      })
    })

    it('should handle single skill', () => {
      const skills: SkillResponse[] = [{ id: 1, name: 'Creative Writing', category: 'CREATIVE' }]

      const result = groupSkillsByCategory(skills)

      expect(Object.keys(result)).toHaveLength(1)
      expect(result.CREATIVE).toHaveLength(1)
      expect(result.CREATIVE[0].name).toBe('Creative Writing')
    })

    it('should handle all categories', () => {
      const skills: SkillResponse[] = [
        { id: 1, name: 'Skill1', category: 'TECHNICAL' },
        { id: 2, name: 'Skill2', category: 'COMMUNICATION' },
        { id: 3, name: 'Skill3', category: 'LEADERSHIP' },
        { id: 4, name: 'Skill4', category: 'CREATIVE' },
        { id: 5, name: 'Skill5', category: 'ADMINISTRATIVE' },
        { id: 6, name: 'Skill6', category: 'SOCIAL' },
        { id: 7, name: 'Skill7', category: 'LANGUAGE' },
        { id: 8, name: 'Skill8', category: 'OTHER' },
      ]

      const result = groupSkillsByCategory(skills)

      expect(Object.keys(result)).toHaveLength(8)
      expect(result.TECHNICAL).toHaveLength(1)
      expect(result.COMMUNICATION).toHaveLength(1)
      expect(result.LEADERSHIP).toHaveLength(1)
      expect(result.CREATIVE).toHaveLength(1)
      expect(result.ADMINISTRATIVE).toHaveLength(1)
      expect(result.SOCIAL).toHaveLength(1)
      expect(result.LANGUAGE).toHaveLength(1)
      expect(result.OTHER).toHaveLength(1)
    })
  })

  describe('toggleSkillId', () => {
    it('should add skill ID when not present in set', () => {
      const skillIds = new Set<number>([1, 2, 3])

      const result = toggleSkillId(skillIds, 4)

      expect(result.has(4)).toBe(true)
      expect(result.size).toBe(4)
    })

    it('should remove skill ID when already present in set', () => {
      const skillIds = new Set<number>([1, 2, 3])

      const result = toggleSkillId(skillIds, 2)

      expect(result.has(2)).toBe(false)
      expect(result.size).toBe(2)
    })

    it('should return a new set and not mutate original', () => {
      const skillIds = new Set<number>([1, 2, 3])

      const result = toggleSkillId(skillIds, 4)

      expect(result).not.toBe(skillIds)
      expect(skillIds.size).toBe(3)
      expect(skillIds.has(4)).toBe(false)
    })

    it('should handle empty set - add skill', () => {
      const skillIds = new Set<number>()

      const result = toggleSkillId(skillIds, 1)

      expect(result.has(1)).toBe(true)
      expect(result.size).toBe(1)
    })

    it('should handle removing last skill from set', () => {
      const skillIds = new Set<number>([1])

      const result = toggleSkillId(skillIds, 1)

      expect(result.has(1)).toBe(false)
      expect(result.size).toBe(0)
    })

    it('should preserve other skill IDs when toggling', () => {
      const skillIds = new Set<number>([1, 2, 3, 4, 5])

      const result = toggleSkillId(skillIds, 3)

      expect(result.has(1)).toBe(true)
      expect(result.has(2)).toBe(true)
      expect(result.has(3)).toBe(false)
      expect(result.has(4)).toBe(true)
      expect(result.has(5)).toBe(true)
    })
  })
})
