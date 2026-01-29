import { createFileRoute, redirect } from '@tanstack/react-router'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthToken } from '@/lib/auth'

export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    const token = getAuthToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { user, setUser } = useAuth()

  const handleSuccess = (response: { name: string }) => {
    // Update the user context with the new name
    if (user) {
      setUser({
        ...user,
        name: response.name,
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted mt-1">
            Manage your profile information and skills to be matched with relevant opportunities
          </p>
        </div>

        <ProfileForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
