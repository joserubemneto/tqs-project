import { Link } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import {
  type AuthResponse,
  parseAuthError,
  type RegisterRequest,
  register,
  setAuthToken,
  type UserRole,
} from '@/lib/auth'

interface RegisterFormProps {
  onSuccess?: (response: AuthResponse) => void
}

interface FormErrors {
  email?: string
  password?: string
  name?: string
  general?: string
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('VOLUNTEER')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!name) {
      newErrors.name = 'Name is required'
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const data: RegisterRequest = { email, password, name, role }
      const response = await register(data)

      setAuthToken(response.token)
      setUser({
        id: response.id,
        email: response.email,
        name: response.name,
        role: response.role,
      })
      onSuccess?.(response)
    } catch (error) {
      const message = await parseAuthError(error)
      setErrors({ general: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Join the UA Volunteering Platform and start making a difference
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.general && (
            <div
              className="p-3 rounded-lg bg-error/10 border border-error text-error text-sm"
              role="alert"
            >
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" required>
              Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              disabled={isLoading}
              autoComplete="name"
            />
            {errors.name && <p className="text-sm text-error">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@ua.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && <p className="text-sm text-error">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.password && <p className="text-sm text-error">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">I want to join as</Label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary-500"
            >
              <option value="VOLUNTEER">Volunteer - Help with opportunities</option>
              <option value="PROMOTER">Promoter - Create opportunities</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
