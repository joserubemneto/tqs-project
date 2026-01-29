import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'

// Mock TanStack Router
const mockRedirect = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    (_path: string) =>
    (options: { beforeLoad?: () => void; component: React.ComponentType; errorComponent?: React.ComponentType }) => ({
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
  redirect: (options: { to: string; search?: Record<string, string> }) => {
    mockRedirect(options)
    throw new Error('Redirect')
  },
}))

// Mock getAuthToken and isAdmin
const mockGetAuthToken = vi.fn()
const mockIsAdmin = vi.fn()
vi.mock('@/lib/auth', () => ({
  getAuthToken: () => mockGetAuthToken(),
  isAdmin: () => mockIsAdmin(),
}))

// Import after mocks are set up
import { Route } from '@/routes/admin/index'

// Get the component from the route
const AdminDashboard = Route.options.component as React.ComponentType
const AdminForbidden = Route.options.errorComponent as React.ComponentType
const beforeLoad = Route.options.beforeLoad as () => void

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('beforeLoad guard', () => {
    it('should redirect to login when no token is present', () => {
      mockGetAuthToken.mockReturnValue(null)
      mockIsAdmin.mockReturnValue(false)

      expect(() => beforeLoad()).toThrow('Redirect')
      expect(mockRedirect).toHaveBeenCalledWith({ to: '/login' })
    })

    it('should redirect to home with error when user is not admin', () => {
      mockGetAuthToken.mockReturnValue('valid-token')
      mockIsAdmin.mockReturnValue(false)

      expect(() => beforeLoad()).toThrow('Redirect')
      expect(mockRedirect).toHaveBeenCalledWith({ to: '/', search: { error: 'forbidden' } })
    })

    it('should not redirect when token is present and user is admin', () => {
      mockGetAuthToken.mockReturnValue('valid-token')
      mockIsAdmin.mockReturnValue(true)

      expect(() => beforeLoad()).not.toThrow()
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('rendering AdminDashboard', () => {
    it('should render the Admin Dashboard heading', () => {
      render(<AdminDashboard />)

      expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument()
    })

    it('should render description text', () => {
      render(<AdminDashboard />)

      expect(screen.getByText(/manage users, roles, and platform settings/i)).toBeInTheDocument()
    })

    it('should render Manage Users card', () => {
      render(<AdminDashboard />)

      expect(screen.getByText('Manage Users')).toBeInTheDocument()
      expect(screen.getByText(/view and manage user accounts and roles/i)).toBeInTheDocument()
    })

    it('should render View Users button with link to /admin/users', () => {
      render(<AdminDashboard />)

      const viewUsersLink = screen.getByRole('link', { name: /view users/i })
      expect(viewUsersLink).toBeInTheDocument()
      expect(viewUsersLink).toHaveAttribute('href', '/admin/users')
    })

    it('should render Opportunities card', () => {
      render(<AdminDashboard />)

      expect(screen.getByText('Opportunities')).toBeInTheDocument()
      expect(screen.getByText(/review and approve volunteering opportunities/i)).toBeInTheDocument()
    })

    it('should render Reports card', () => {
      render(<AdminDashboard />)

      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByText(/view platform analytics and reports/i)).toBeInTheDocument()
    })

    it('should have Coming Soon buttons disabled', () => {
      render(<AdminDashboard />)

      const comingSoonButtons = screen.getAllByRole('button', { name: /coming soon/i })
      expect(comingSoonButtons).toHaveLength(2)
      for (const button of comingSoonButtons) {
        expect(button).toBeDisabled()
      }
    })
  })

  describe('rendering AdminForbidden', () => {
    it('should render Access Denied heading', () => {
      render(<AdminForbidden />)

      expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument()
    })

    it('should render permission error message', () => {
      render(<AdminForbidden />)

      expect(screen.getByText(/you don't have permission to access the admin panel/i)).toBeInTheDocument()
    })

    it('should render Return to Home button', () => {
      render(<AdminForbidden />)

      const homeLink = screen.getByRole('link', { name: /return to home/i })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })
})
