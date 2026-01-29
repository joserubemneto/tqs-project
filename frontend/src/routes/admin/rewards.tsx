import { createFileRoute, redirect } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { RewardsManagement } from '@/components/reward'
import { Button } from '@/components/ui'
import { getAuthToken, isAdmin } from '@/lib/auth'

export const Route = createFileRoute('/admin/rewards')({
  beforeLoad: () => {
    const token = getAuthToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
    // Check if user has admin role
    if (!isAdmin()) {
      throw redirect({ to: '/', search: { error: 'forbidden' } })
    }
  },
  component: AdminRewardsPage,
  errorComponent: AdminForbidden,
})

function AdminForbidden() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-6" />
      <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
      <p className="text-muted-foreground mb-8">
        You don't have permission to manage rewards.
        <br />
        Please contact an administrator if you believe this is an error.
      </p>
      <a href="/">
        <Button variant="primary">Return to Home</Button>
      </a>
    </div>
  )
}

function AdminRewardsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Rewards Management</h1>
        <p className="text-muted mt-2">
          Create and manage rewards that volunteers can redeem with their points
        </p>
      </div>

      <RewardsManagement />
    </div>
  )
}
