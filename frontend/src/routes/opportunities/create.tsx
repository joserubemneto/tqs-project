import { createFileRoute, redirect } from '@tanstack/react-router'
import { OpportunityForm } from '@/components/opportunity/OpportunityForm'
import { getAuthToken, getUserRoleFromToken } from '@/lib/auth'

export const Route = createFileRoute('/opportunities/create')({
  beforeLoad: () => {
    const token = getAuthToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }

    const role = getUserRoleFromToken()
    if (role !== 'PROMOTER' && role !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: CreateOpportunityPage,
})

function CreateOpportunityPage() {
  const handleSuccess = () => {
    // Form resets on success, staying on the page for creating more opportunities
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Create Opportunity</h1>
          <p className="text-muted mt-1">
            Create a new volunteering opportunity for volunteers to discover and apply
          </p>
        </div>

        <OpportunityForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
