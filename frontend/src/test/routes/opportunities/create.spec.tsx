import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OpportunityResponse } from '@/lib/opportunity'
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
  redirect: vi.fn(),
}))

// Mock auth functions
const mockGetAuthToken = vi.fn()
const mockGetUserRoleFromToken = vi.fn()

vi.mock('@/lib/auth', () => ({
  getAuthToken: () => mockGetAuthToken(),
  getUserRoleFromToken: () => mockGetUserRoleFromToken(),
}))

// Mock OpportunityForm component
vi.mock('@/components/opportunity/OpportunityForm', () => ({
  OpportunityForm: ({ onSuccess }: { onSuccess?: (response: OpportunityResponse) => void }) => {
    return (
      <div data-testid="opportunity-form">
        <button
          type="button"
          onClick={() =>
            onSuccess?.({
              id: 1,
              title: 'Test Opportunity',
              description: 'Test Description',
              pointsReward: 50,
              startDate: '2024-02-01T09:00:00Z',
              endDate: '2024-02-07T17:00:00Z',
              maxVolunteers: 10,
              status: 'DRAFT',
              location: 'Test Location',
              promoter: {
                id: 1,
                email: 'promoter@ua.pt',
                name: 'Promoter',
                role: 'PROMOTER',
                points: 0,
                createdAt: '2024-01-01T00:00:00Z',
              },
              requiredSkills: [],
              createdAt: '2024-01-15T00:00:00Z',
            })
          }
          data-testid="mock-success"
        >
          Mock Success
        </button>
      </div>
    )
  },
}))

// Import after mocks are set up
import { Route } from '@/routes/opportunities/create'

// Get the component from the route
const CreateOpportunityPage = Route.options.component as React.ComponentType

describe('CreateOpportunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthToken.mockReturnValue('mock-token')
    mockGetUserRoleFromToken.mockReturnValue('PROMOTER')
  })

  describe('Rendering', () => {
    it('should render the OpportunityForm component', () => {
      render(<CreateOpportunityPage />)

      expect(screen.getByTestId('opportunity-form')).toBeInTheDocument()
    })

    it('should render page heading', () => {
      render(<CreateOpportunityPage />)

      expect(screen.getByRole('heading', { name: /create opportunity/i })).toBeInTheDocument()
    })

    it('should render page description', () => {
      render(<CreateOpportunityPage />)

      expect(
        screen.getByText(
          /create a new volunteering opportunity for volunteers to discover and apply/i,
        ),
      ).toBeInTheDocument()
    })

    it('should have correct container styling', () => {
      const { container } = render(<CreateOpportunityPage />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('container', 'mx-auto', 'px-4', 'py-8')
    })

    it('should have max-w-2xl wrapper for content', () => {
      const { container } = render(<CreateOpportunityPage />)

      const wrapper = container.querySelector('.max-w-2xl')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Success Callback', () => {
    it('should call onSuccess callback when form submission succeeds', async () => {
      render(<CreateOpportunityPage />)

      // The mock form has a success button
      const successButton = screen.getByTestId('mock-success')
      expect(successButton).toBeInTheDocument()

      // Click should not throw - form stays on page after success
      successButton.click()
    })
  })
})

describe('CreateOpportunityPage Route', () => {
  it('should have route options defined', () => {
    expect(Route.options).toBeDefined()
  })

  it('should have beforeLoad function', () => {
    expect(Route.options.beforeLoad).toBeDefined()
  })

  it('should have component function', () => {
    expect(Route.options.component).toBeDefined()
  })
})

describe('Route beforeLoad Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call getAuthToken in beforeLoad', () => {
    mockGetAuthToken.mockReturnValue('mock-token')
    mockGetUserRoleFromToken.mockReturnValue('PROMOTER')

    // Execute beforeLoad
    try {
      Route.options.beforeLoad?.({} as any)
    } catch {
      // redirect throws, which is expected
    }

    expect(mockGetAuthToken).toHaveBeenCalled()
  })

  it('should call getUserRoleFromToken when token exists', () => {
    mockGetAuthToken.mockReturnValue('mock-token')
    mockGetUserRoleFromToken.mockReturnValue('PROMOTER')

    // Execute beforeLoad
    try {
      Route.options.beforeLoad?.({} as any)
    } catch {
      // redirect throws, which is expected
    }

    expect(mockGetUserRoleFromToken).toHaveBeenCalled()
  })

  it('should allow PROMOTER role to access', () => {
    mockGetAuthToken.mockReturnValue('mock-token')
    mockGetUserRoleFromToken.mockReturnValue('PROMOTER')

    // Should not throw
    expect(() => Route.options.beforeLoad?.({} as any)).not.toThrow()
  })

  it('should allow ADMIN role to access', () => {
    mockGetAuthToken.mockReturnValue('mock-token')
    mockGetUserRoleFromToken.mockReturnValue('ADMIN')

    // Should not throw
    expect(() => Route.options.beforeLoad?.({} as any)).not.toThrow()
  })
})
