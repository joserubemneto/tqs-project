import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/LoginForm'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate({ to: '/' })
  }

  return (
    <div className="container mx-auto max-w-md px-4 pb-8">
      <LoginForm onSuccess={handleSuccess} />
    </div>
  )
}
