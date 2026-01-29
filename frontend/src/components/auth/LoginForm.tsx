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
import { type AuthResponse, type LoginRequest, login, parseAuthError, setAuthToken } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormProps {
  onSuccess?: (response: AuthResponse) => void
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      const data: LoginRequest = { email, password }
      const response = await login(data)

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
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to access the UA Volunteering Platform</CardDescription>
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {errors.password && <p className="text-sm text-error">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
