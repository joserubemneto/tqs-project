import type { SkillCategory, SkillResponse } from './profile'

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
 * Groups skills by their category
 */
export function groupSkillsByCategory(
  skills: SkillResponse[],
): Record<string, SkillResponse[]> {
  return skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    },
    {} as Record<string, SkillResponse[]>,
  )
}

/**
 * Toggles a skill ID in a set and returns a new set
 */
export function toggleSkillId(skillIds: Set<number>, skillId: number): Set<number> {
  const newSet = new Set(skillIds)
  if (newSet.has(skillId)) {
    newSet.delete(skillId)
  } else {
    newSet.add(skillId)
  }
  return newSet
}
