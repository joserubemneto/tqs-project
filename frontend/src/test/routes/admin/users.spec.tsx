import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'

// Mock TanStack Router
const mockRedirect = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    (_path: string) => (options: { beforeLoad?: () => void; component: React.ComponentType }) => ({
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
  redirect: (options: { to: string }) => {
    mockRedirect(options)
    throw new Error('Redirect')
  },
}))

// Mock getAuthToken
const mockGetAuthToken = vi.fn()
vi.mock('@/lib/auth', () => ({
  getAuthToken: () => mockGetAuthToken(),
}))

// Import after mocks are set up
import { Route } from '@/routes/admin/users'

// Get the component from the route
const UsersPage = Route.options.component as React.ComponentType
const beforeLoad = Route.options.beforeLoad as () => void

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('beforeLoad guard', () => {
    it('should redirect to login when no token is present', () => {
      mockGetAuthToken.mockReturnValue(null)

      expect(() => beforeLoad()).toThrow('Redirect')
      expect(mockRedirect).toHaveBeenCalledWith({ to: '/login' })
    })

    it('should not redirect when token is present', () => {
      mockGetAuthToken.mockReturnValue('valid-token')

      expect(() => beforeLoad()).not.toThrow()
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('rendering', () => {
    it('should render the Manage Users heading', () => {
      render(<UsersPage />)

      expect(screen.getByRole('heading', { name: /manage users/i })).toBeInTheDocument()
    })

    it('should render description text', () => {
      render(<UsersPage />)

      expect(screen.getByText(/view and update user roles/i)).toBeInTheDocument()
    })

    it('should render Back to Dashboard button with link to /admin', () => {
      render(<UsersPage />)

      const backLink = screen.getByRole('link', { name: /back to dashboard/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/admin')
    })

    it('should render User List card', () => {
      render(<UsersPage />)

      expect(screen.getByText('User List')).toBeInTheDocument()
    })

    it('should render placeholder text for user management table', () => {
      render(<UsersPage />)

      expect(
        screen.getByText(/user management table will be implemented here/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/this requires the backend api endpoints to be created first/i),
      ).toBeInTheDocument()
    })
  })
})
