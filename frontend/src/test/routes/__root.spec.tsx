import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock useAuth hook
const mockLogout = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  createRootRoute: (options: { component: React.ComponentType }) => ({
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
    <a href={to} className={className} data-testid={`link-${to}`}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  useNavigate: () => mockNavigate,
}))

// Mock TanStack Router Devtools
vi.mock('@tanstack/router-devtools', () => ({
  TanStackRouterDevtools: () => null,
}))

// Import after mocks are set up
import { Route } from '@/routes/__root'

// Get the component from the route
const RootComponent = Route.options.component as React.ComponentType

describe('RootComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('should show loading skeleton when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        logout: mockLogout,
      })

      render(<RootComponent />)

      // Should show loading skeleton
      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()

      // Should not show sign in or user info
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      expect(screen.queryByText('Logout')).not.toBeInTheDocument()
    })
  })

  describe('logged out state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: mockLogout,
      })
    })

    it('should show Sign In and Get Started buttons when not logged in', () => {
      render(<RootComponent />)

      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
    })

    it('should not show logout button when not logged in', () => {
      render(<RootComponent />)

      expect(screen.queryByText('Logout')).not.toBeInTheDocument()
    })

    it('should have correct links for Sign In and Get Started', () => {
      render(<RootComponent />)

      expect(screen.getByTestId('link-/login')).toBeInTheDocument()
      expect(screen.getByTestId('link-/register')).toBeInTheDocument()
    })
  })

  describe('logged in as VOLUNTEER', () => {
    const volunteerUser = {
      id: 1,
      email: 'volunteer@ua.pt',
      name: 'Test Volunteer',
      role: 'VOLUNTEER' as const,
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: volunteerUser,
        isLoading: false,
        logout: mockLogout,
      })
    })

    it('should show user name and role', () => {
      render(<RootComponent />)

      expect(screen.getByText('Test Volunteer')).toBeInTheDocument()
      expect(screen.getByText('VOLUNTEER')).toBeInTheDocument()
    })

    it('should show user avatar with first letter of name', () => {
      render(<RootComponent />)

      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('should show logout button', () => {
      render(<RootComponent />)

      expect(screen.getByText('Logout')).toBeInTheDocument()
    })

    it('should not show Admin Panel button for non-admin users', () => {
      render(<RootComponent />)

      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    })

    it('should not show Sign In or Get Started buttons', () => {
      render(<RootComponent />)

      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
    })

    it('should call logout and navigate to home when logout is clicked', async () => {
      const user = userEvent.setup()
      render(<RootComponent />)

      const logoutButton = screen.getByText('Logout')
      await user.click(logoutButton)

      expect(mockLogout).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    })
  })

  describe('logged in as ADMIN', () => {
    const adminUser = {
      id: 2,
      email: 'admin@ua.pt',
      name: 'Admin User',
      role: 'ADMIN' as const,
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        isLoading: false,
        logout: mockLogout,
      })
    })

    it('should show Admin Panel button for admin users', () => {
      render(<RootComponent />)

      expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    })

    it('should have correct link for Admin Panel', () => {
      render(<RootComponent />)

      expect(screen.getByTestId('link-/admin')).toBeInTheDocument()
    })

    it('should show user name and admin role', () => {
      render(<RootComponent />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('ADMIN')).toBeInTheDocument()
    })

    it('should show user avatar with first letter of name', () => {
      render(<RootComponent />)

      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  describe('user avatar fallback', () => {
    it('should use email first letter if name is empty', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 3,
          email: 'user@ua.pt',
          name: '',
          role: 'VOLUNTEER' as const,
        },
        isLoading: false,
        logout: mockLogout,
      })

      render(<RootComponent />)

      // Should fall back to email first letter
      expect(screen.getByText('U')).toBeInTheDocument()
    })

    it('should use "U" as fallback if both name and email are undefined', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 4,
          email: '',
          name: '',
          role: 'VOLUNTEER' as const,
        },
        isLoading: false,
        logout: mockLogout,
      })

      render(<RootComponent />)

      // Should fall back to 'U'
      expect(screen.getByText('U')).toBeInTheDocument()
    })
  })

  describe('header and navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: mockLogout,
      })
    })

    it('should render the UA Volunteering brand link in navigation', () => {
      render(<RootComponent />)

      expect(screen.getByText('UA Volunteering')).toBeInTheDocument()
      // There are two home links (nav brand + hero title)
      const homeLinks = screen.getAllByTestId('link-/')
      expect(homeLinks).toHaveLength(2)
    })

    it('should render the hero section with title and description', () => {
      render(<RootComponent />)

      expect(screen.getByText('UA Volunteering Platform')).toBeInTheDocument()
      expect(
        screen.getByText(/Connect with volunteering opportunities at Universidade de Aveiro/),
      ).toBeInTheDocument()
    })

    it('should render the Outlet for child routes', () => {
      render(<RootComponent />)

      expect(screen.getByTestId('outlet')).toBeInTheDocument()
    })
  })
})
