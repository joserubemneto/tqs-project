import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthResponse } from '@/lib/auth'
import { render, screen } from '@/test/test-utils'

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: { component: React.ComponentType }) => ({
    ...options,
    options,
  }),
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}))

// Mock RegisterForm component
vi.mock('@/components/auth/RegisterForm', () => ({
  RegisterForm: ({ onSuccess }: { onSuccess?: (response: AuthResponse) => void }) => {
    return (
      <div data-testid="register-form">
        <button
          type="button"
          onClick={() =>
            onSuccess?.({
              id: 1,
              email: 'test@ua.pt',
              name: 'Test User',
              role: 'VOLUNTEER',
              token: 'mock-token',
            })
          }
          data-testid="mock-volunteer-success"
        >
          Mock Volunteer Success
        </button>
        <button
          type="button"
          onClick={() =>
            onSuccess?.({
              id: 2,
              email: 'admin@ua.pt',
              name: 'Admin User',
              role: 'ADMIN',
              token: 'mock-token',
            })
          }
          data-testid="mock-admin-success"
        >
          Mock Admin Success
        </button>
      </div>
    )
  },
}))

// Import after mocks are set up
import { Route } from '@/routes/register'

// Get the component from the route
const RegisterPage = Route.options.component as React.ComponentType

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the RegisterForm component', () => {
    render(<RegisterPage />)

    expect(screen.getByTestId('register-form')).toBeInTheDocument()
  })

  // Note: "Already have an account?" text is part of RegisterForm component
  // which is tested in RegisterForm.spec.tsx

  it('should navigate to home page on successful registration for non-admin users', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const successButton = screen.getByTestId('mock-volunteer-success')
    await user.click(successButton)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('should navigate to admin page on successful registration for admin users', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const successButton = screen.getByTestId('mock-admin-success')
    await user.click(successButton)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/admin' })
  })

  it('should have correct container styling', () => {
    const { container } = render(<RegisterPage />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('container', 'mx-auto', 'max-w-md', 'px-4', 'pb-8')
  })
})
