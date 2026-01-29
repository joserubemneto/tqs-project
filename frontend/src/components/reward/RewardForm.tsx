import { useEffect, useState } from 'react'
import { Button, Input, Label, Select, Textarea } from '@/components/ui'
import { getActivePartners, type PartnerResponse } from '@/lib/partner'
import type {
  CreateRewardRequest,
  RewardResponse,
  RewardType,
  UpdateRewardRequest,
} from '@/lib/reward'

interface RewardFormProps {
  initialData?: RewardResponse
  onSubmit: (data: CreateRewardRequest | UpdateRewardRequest) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const REWARD_TYPES: { value: RewardType; label: string }[] = [
  { value: 'UA_SERVICE', label: 'UA Service' },
  { value: 'PARTNER_VOUCHER', label: 'Partner Voucher' },
  { value: 'MERCHANDISE', label: 'Merchandise' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'OTHER', label: 'Other' },
]

export function RewardForm({ initialData, onSubmit, onCancel, isSubmitting }: RewardFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    pointsCost: initialData?.pointsCost?.toString() || '',
    type: initialData?.type || ('OTHER' as RewardType),
    partnerId: initialData?.partner?.id?.toString() || '',
    quantity: initialData?.quantity?.toString() || '',
    availableFrom: initialData?.availableFrom ? initialData.availableFrom.slice(0, 16) : '',
    availableUntil: initialData?.availableUntil ? initialData.availableUntil.slice(0, 16) : '',
    active: initialData?.active ?? true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [partners, setPartners] = useState<PartnerResponse[]>([])
  const [loadingPartners, setLoadingPartners] = useState(false)

  // Fetch partners when type is PARTNER_VOUCHER
  useEffect(() => {
    if (formData.type === 'PARTNER_VOUCHER' && partners.length === 0) {
      setLoadingPartners(true)
      getActivePartners()
        .then((data) => setPartners(data))
        .catch((err) => console.error('Failed to load partners:', err))
        .finally(() => setLoadingPartners(false))
    }
  }, [formData.type, partners.length])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    const pointsCost = parseInt(formData.pointsCost, 10)
    if (Number.isNaN(pointsCost) || pointsCost < 1) {
      newErrors.pointsCost = 'Points cost must be at least 1'
    }

    if (formData.quantity) {
      const quantity = parseInt(formData.quantity, 10)
      if (Number.isNaN(quantity) || quantity < 0) {
        newErrors.quantity = 'Quantity must be a positive number'
      }
    }

    if (formData.availableFrom && formData.availableUntil) {
      if (new Date(formData.availableFrom) >= new Date(formData.availableUntil)) {
        newErrors.availableUntil = 'End date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const data: CreateRewardRequest | UpdateRewardRequest = {
      title: formData.title,
      description: formData.description,
      pointsCost: parseInt(formData.pointsCost, 10),
      type: formData.type,
      partnerId: formData.partnerId ? parseInt(formData.partnerId, 10) : undefined,
      quantity: formData.quantity ? parseInt(formData.quantity, 10) : undefined,
      availableFrom: formData.availableFrom || undefined,
      availableUntil: formData.availableUntil || undefined,
    }

    if (initialData) {
      ;(data as UpdateRewardRequest).active = formData.active
    }

    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Free Coffee Voucher"
          className={errors.title ? 'border-destructive' : ''}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the reward and how to redeem it..."
          rows={3}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pointsCost">Points Cost *</Label>
          <Input
            id="pointsCost"
            type="number"
            min="1"
            value={formData.pointsCost}
            onChange={(e) => setFormData((prev) => ({ ...prev, pointsCost: e.target.value }))}
            placeholder="e.g., 50"
            className={errors.pointsCost ? 'border-destructive' : ''}
          />
          {errors.pointsCost && <p className="text-sm text-destructive">{errors.pointsCost}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            id="type"
            value={formData.type}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                type: e.target.value as RewardType,
                partnerId: e.target.value !== 'PARTNER_VOUCHER' ? '' : prev.partnerId,
              }))
            }
            options={REWARD_TYPES}
          />
        </div>
      </div>

      {formData.type === 'PARTNER_VOUCHER' && (
        <div className="space-y-2">
          <Label htmlFor="partnerId">Partner</Label>
          {loadingPartners ? (
            <div className="text-sm text-muted-foreground">Loading partners...</div>
          ) : partners.length === 0 ? (
            <div className="text-sm text-muted-foreground">No active partners available</div>
          ) : (
            <Select
              id="partnerId"
              value={formData.partnerId}
              onChange={(e) => setFormData((prev) => ({ ...prev, partnerId: e.target.value }))}
              options={[
                { value: '', label: 'Select a partner (optional)' },
                ...partners.map((p) => ({ value: p.id.toString(), label: p.name })),
              ]}
            />
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity (leave empty for unlimited)</Label>
        <Input
          id="quantity"
          type="number"
          min="0"
          value={formData.quantity}
          onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
          placeholder="e.g., 100"
          className={errors.quantity ? 'border-destructive' : ''}
        />
        {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="availableFrom">Available From</Label>
          <Input
            id="availableFrom"
            type="datetime-local"
            value={formData.availableFrom}
            onChange={(e) => setFormData((prev) => ({ ...prev, availableFrom: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="availableUntil">Available Until</Label>
          <Input
            id="availableUntil"
            type="datetime-local"
            value={formData.availableUntil}
            onChange={(e) => setFormData((prev) => ({ ...prev, availableUntil: e.target.value }))}
            className={errors.availableUntil ? 'border-destructive' : ''}
          />
          {errors.availableUntil && (
            <p className="text-sm text-destructive">{errors.availableUntil}</p>
          )}
        </div>
      </div>

      {initialData && (
        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="active">Active</Label>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Reward' : 'Create Reward'}
        </Button>
      </div>
    </form>
  )
}
