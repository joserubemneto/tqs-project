import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApplicationResponse } from '@/lib/application'
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
    params,
    className,
    ...rest
  }: {
    children: React.ReactNode
    to: string
    params?: Record<string, string>
    className?: string
    [key: string]: unknown
  }) => {
    // Build the href by replacing params in the path
    let href = to
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        href = href.replace(`$${key}`, value)
      })
    }
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    )
  },
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}))

// Mock application API
const mockGetMyApplications = vi.fn()

vi.mock('@/lib/application', async () => {
  const actual = await vi.importActual('@/lib/application')
  return {
    ...actual,
    getMyApplications: () => mockGetMyApplications(),
  }
})

// Mock useAuth hook
const mockUseAuth = vi.fn()

vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  }
})

// Import after mocks are set up
import { Route } from '@/routes/my-applications'

// Get the component from the route
const MyApplicationsPage = Route.options.component as React.ComponentType

const mockApplications: ApplicationResponse[] = [
  {
    id: 1,
    status: 'PENDING',
    message: 'I would love to help!',
    appliedAt: '2024-01-15T10:00:00Z',
    opportunity: {
      id: 1,
      title: 'UA Open Day Support',
      status: 'OPEN',
      startDate: '2024-02-01T09:00:00Z',
      endDate: '2024-02-07T17:00:00Z',
      pointsReward: 50,
      location: 'University Campus',
    },
    volunteer: {
      id: 1,
      email: 'volunteer@ua.pt',
      name: 'Volunteer',
      role: 'VOLUNTEER',
      points: 0,
    },
  },
  {
    id: 2,
    status: 'APPROVED',
    message: undefined,
    appliedAt: '2024-01-10T14:00:00Z',
    opportunity: {
      id: 2,
      title: 'Beach Cleanup',
      status: 'OPEN',
      startDate: '2024-03-01T08:00:00Z',
      endDate: '2024-03-01T12:00:00Z',
      pointsReward: 30,
      location: 'Praia da Costa Nova',
    },
    volunteer: {
      id: 1,
      email: 'volunteer@ua.pt',
      name: 'Volunteer',
      role: 'VOLUNTEER',
      points: 0,
    },
  },
]

describe('MyApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should show loading while checking auth', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: true })

      render(<MyApplicationsPage />)

      expect(screen.getByTestId('auth-loading')).toBeInTheDocument()
    })

    it('should redirect to login when not logged in', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false })

      render(<MyApplicationsPage />)

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
    })

    it('should show access restricted for non-volunteers', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'promoter@ua.pt', name: 'Promoter', role: 'PROMOTER' },
        isLoading: false,
      })

      render(<MyApplicationsPage />)

      expect(screen.getByTestId('not-volunteer')).toBeInTheDocument()
      expect(screen.getByText('Access Restricted')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching applications', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
      })
      mockGetMyApplications.mockReturnValue(new Promise(() => {}))

      render(<MyApplicationsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('should show error message when API fails', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
      })
      mockGetMyApplications.mockRejectedValue(new Error('API Error'))

      render(<MyApplicationsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })
      expect(screen.getByText('Failed to load applications')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no applications', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
      })
      mockGetMyApplications.mockResolvedValue([])

      render(<MyApplicationsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })
      expect(screen.getByText("You haven't applied to any opportunities yet")).toBeInTheDocument()
    })
  })

  describe('Applications List', () => {
    it('should display list of applications', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
      })
      mockGetMyApplications.mockResolvedValue(mockApplications)

      render(<MyApplicationsPage />)

      await waitFor(() => {
        expect(screen.getByText('UA Open Day Support')).toBeInTheDocument()
      })
      expect(screen.getByText('Beach Cleanup')).toBeInTheDocument()
    })

    it('should display application count', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
      })
      mockGetMyApplications.mockResolvedValue(mockApplications)

      render(<MyApplicationsPage />)

      await waitFor(() => {
        expect(screen.getByText('2 applications')).toBeInTheDocument()
      })
    })

    it('should display application status badges', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
      })
      mockGetMyApplications.mockResolvedValue(mockApplications)

      render(<MyApplicationsPage />)

      await waitFor(() => {
        const badges = screen.getAllByTestId('status-badge')
        expect(badges).toHaveLength(2)
        expect(badges[0]).toHaveTextContent('Pending')
        expect(badges[1]).toHaveTextContent('Approved')
      })
    })

    it('should display opportunity details in cards', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
      })
      mockGetMyApplications.mockResolvedValue(mockApplications)

      render(<MyApplicationsPage />)

      await waitFor(() => {
        expect(screen.getByText('University Campus')).toBeInTheDocument()
      })
      expect(screen.getByText('Praia da Costa Nova')).toBeInTheDocument()
      expect(screen.getByText('50 points')).toBeInTheDocument()
      expect(screen.getByText('30 points')).toBeInTheDocument()
    })

    it('should link to opportunity detail page', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
      })
      mockGetMyApplications.mockResolvedValue([mockApplications[0]])

      render(<MyApplicationsPage />)

      await waitFor(() => {
        const link = screen.getByTestId('application-card-link-1')
        expect(link).toBeInTheDocument()
        // The link should contain the opportunity ID in the href
        expect(link).toHaveAttribute('href')
        expect(link.getAttribute('href')).toContain('1')
      })
    })
  })
})
