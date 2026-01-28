import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  RegisterForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="register-form">
      <button type="button" onClick={onSuccess} data-testid="mock-success-button">
        Mock Success
      </button>
    </div>
  ),
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

  it('should render "Already have an account?" text', () => {
    render(<RegisterPage />)

    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
  })

  it('should render "Back to Home" link', () => {
    render(<RegisterPage />)

    const link = screen.getByRole('link', { name: /back to home/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('should navigate to home page on successful registration', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const successButton = screen.getByTestId('mock-success-button')
    await user.click(successButton)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('should have correct container styling', () => {
    const { container } = render(<RegisterPage />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('container', 'mx-auto', 'max-w-md', 'px-4', 'pb-8')
  })

  it('should style the "Back to Home" link correctly', () => {
    render(<RegisterPage />)

    const link = screen.getByRole('link', { name: /back to home/i })
    expect(link).toHaveClass('text-primary', 'hover:underline', 'font-medium')
  })
})
