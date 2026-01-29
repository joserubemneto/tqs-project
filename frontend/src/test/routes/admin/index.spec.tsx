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
import { Route } from '@/routes/admin/index'

// Get the component from the route
const AdminDashboard = Route.options.component as React.ComponentType
const beforeLoad = Route.options.beforeLoad as () => void

describe('AdminDashboard', () => {
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
})
