import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate({ to: '/' })
  }

  return (
    <div className="container mx-auto max-w-md px-4 pb-8">
      <RegisterForm onSuccess={handleSuccess} />
    </div>
  )
}
