import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/LoginForm'
import type { AuthResponse } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  const handleSuccess = (response: AuthResponse) => {
    // Redirect admin users to admin panel, others to home
    if (response.role === 'ADMIN') {
      navigate({ to: '/admin' })
    } else {
      navigate({ to: '/' })
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 pb-8">
      <LoginForm onSuccess={handleSuccess} />
    </div>
  )
}
