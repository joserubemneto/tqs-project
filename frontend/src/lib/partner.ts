import { api } from './api'

// ==================== Types ====================

export interface PartnerResponse {
  id: number
  name: string
  description?: string
  logoUrl?: string
  website?: string
  active: boolean
  createdAt: string
}

// ==================== API Functions ====================

/**
 * Get all active partners (admin only)
 * Used for partner selection when creating/editing rewards
 */
export async function getActivePartners(): Promise<PartnerResponse[]> {
  return api.get<PartnerResponse[]>('/admin/partners')
}
