import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'

// Mock TanStack Router
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
}))

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Import after mocks are set up
import { Route } from '@/routes/index'

// Get the component from the route
const HomePage = Route.options.component as React.ComponentType

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user is not logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false })
    })

    it('should render the main cards', () => {
      render(<HomePage />)

      expect(screen.getByText('Discover Opportunities')).toBeInTheDocument()
      expect(screen.getByText('Redeem Rewards')).toBeInTheDocument()
    })

    it('should show "Ready to make a difference?" section for guests', () => {
      render(<HomePage />)

      expect(screen.getByText('Ready to make a difference?')).toBeInTheDocument()
    })

    it('should show Get Started button for guests', () => {
      render(<HomePage />)

      const getStartedLink = screen.getByRole('link', { name: /get started/i })
      expect(getStartedLink).toBeInTheDocument()
      expect(getStartedLink).toHaveAttribute('href', '/register')
    })

    it('should not show welcome back message for guests', () => {
      render(<HomePage />)

      expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument()
    })
  })

  describe('when user is logged in', () => {
    const mockUser = {
      id: 1,
      email: 'test@ua.pt',
      name: 'Test User',
      role: 'VOLUNTEER' as const,
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false })
    })

    it('should render the main cards', () => {
      render(<HomePage />)

      expect(screen.getByText('Discover Opportunities')).toBeInTheDocument()
      expect(screen.getByText('Redeem Rewards')).toBeInTheDocument()
    })

    it('should show personalized welcome message', () => {
      render(<HomePage />)

      expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument()
    })

    it('should show Find Opportunities button', () => {
      render(<HomePage />)

      expect(screen.getByRole('button', { name: /find opportunities/i })).toBeInTheDocument()
    })

    it('should not show guest CTA section', () => {
      render(<HomePage />)

      expect(screen.queryByText('Ready to make a difference?')).not.toBeInTheDocument()
    })
  })

  describe('card actions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false })
    })

    it('should render Explore button in Discover Opportunities card', () => {
      render(<HomePage />)

      expect(screen.getByRole('button', { name: /explore/i })).toBeInTheDocument()
    })

    it('should render Browse Rewards button in Redeem Rewards card', () => {
      render(<HomePage />)

      expect(screen.getByRole('button', { name: /browse rewards/i })).toBeInTheDocument()
    })
  })
})
