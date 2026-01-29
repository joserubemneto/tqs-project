import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RegisterForm } from '@/components/auth/RegisterForm'
import type { AuthResponse } from '@/lib/auth'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
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
      <RegisterForm onSuccess={handleSuccess} />
    </div>
  )
}
