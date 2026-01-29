import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OpportunityResponse } from '@/lib/opportunity'
import { render, screen } from '@/test/test-utils'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: { component: React.ComponentType }) => ({
    ...options,
    options,
    useParams: () => ({ opportunityId: '1' }),
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

// Mock opportunity API
const mockGetOpportunityById = vi.fn()

vi.mock('@/lib/opportunity', async () => {
  const actual = await vi.importActual('@/lib/opportunity')
  return {
    ...actual,
    getOpportunityById: (id: number) => mockGetOpportunityById(id),
  }
})

// Import after mocks are set up
import { Route } from '@/routes/opportunities/$opportunityId'

// Get the component from the route
const OpportunityDetailPage = Route.options.component as React.ComponentType

const mockOpportunity: OpportunityResponse = {
  id: 1,
  title: 'UA Open Day Support',
  description: 'Help with university open day activities and guide visitors around campus.',
  pointsReward: 50,
  startDate: '2024-02-01T09:00:00Z',
  endDate: '2024-02-07T17:00:00Z',
  maxVolunteers: 10,
  status: 'OPEN',
  location: 'University Campus',
  promoter: {
    id: 1,
    email: 'promoter@ua.pt',
    name: 'Promoter User',
    role: 'PROMOTER',
    points: 0,
    createdAt: '2024-01-01T00:00:00Z',
  },
  requiredSkills: [
    {
      id: 1,
      name: 'Communication',
      category: 'COMMUNICATION',
      description: 'Effective communication skills',
    },
    {
      id: 2,
      name: 'Leadership',
      category: 'LEADERSHIP',
      description: 'Leadership skills',
    },
  ],
  createdAt: '2024-01-15T00:00:00Z',
}

describe('OpportunityDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching opportunity', async () => {
      // Never resolve the promise to keep loading state
      mockGetOpportunityById.mockReturnValue(new Promise(() => {}))

      render(<OpportunityDetailPage />)

      expect(screen.getByTestId('loading-state')).toBeInTheDocument()
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Opportunity Details Display', () => {
    it('should display opportunity title', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-title')).toHaveTextContent('UA Open Day Support')
      })
    })

    it('should display opportunity description', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-description')).toHaveTextContent(
          /help with university open day activities/i,
        )
      })
    })

    it('should display opportunity status', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-status')).toHaveTextContent('OPEN')
      })
    })

    it('should display points reward', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-points')).toHaveTextContent('50 points')
      })
    })

    it('should display max volunteers', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-max-volunteers')).toHaveTextContent('10')
      })
    })

    it('should display location', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-location')).toHaveTextContent('University Campus')
      })
    })

    it('should display start date', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-start-date')).toBeInTheDocument()
      })
    })

    it('should display end date', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-end-date')).toBeInTheDocument()
      })
    })

    it('should display all required skills', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        const skillsContainer = screen.getByTestId('opportunity-skills')
        expect(skillsContainer).toHaveTextContent('Communication')
        expect(skillsContainer).toHaveTextContent('Leadership')
      })
    })

    it('should display promoter name', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-promoter')).toHaveTextContent('Promoter User')
      })
    })

    it('should display created at date', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-created-at')).toBeInTheDocument()
      })
    })
  })

  describe('Back Navigation', () => {
    it('should have back to opportunities link', async () => {
      mockGetOpportunityById.mockResolvedValue(mockOpportunity)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /back to opportunities/i })
        expect(backLink).toBeInTheDocument()
        expect(backLink).toHaveAttribute('href', '/opportunities')
      })
    })
  })

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockGetOpportunityById.mockRejectedValue(new Error('Network error'))

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent(/failed to load opportunity/i)
      })
    })

    it('should show not found message for 404 error', async () => {
      mockGetOpportunityById.mockRejectedValue(new Error('API Error: 404 Not Found'))

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent(/opportunity not found/i)
      })
    })

    it('should show back to opportunities link on error', async () => {
      mockGetOpportunityById.mockRejectedValue(new Error('Network error'))

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /back to opportunities/i })
        expect(backLink).toBeInTheDocument()
      })
    })

    it('should show try again button on non-404 error', async () => {
      mockGetOpportunityById.mockRejectedValue(new Error('Network error'))

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })
  })

  describe('Opportunity without location', () => {
    it('should not render location section when location is not provided', async () => {
      const opportunityWithoutLocation = {
        ...mockOpportunity,
        location: undefined,
      }
      mockGetOpportunityById.mockResolvedValue(opportunityWithoutLocation)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-title')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('opportunity-location')).not.toBeInTheDocument()
    })
  })

  describe('Opportunity without skills', () => {
    it('should show message when no skills required', async () => {
      const opportunityWithoutSkills = {
        ...mockOpportunity,
        requiredSkills: [],
      }
      mockGetOpportunityById.mockResolvedValue(opportunityWithoutSkills)

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/no specific skills required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Different opportunity statuses', () => {
    it('should display DRAFT status correctly', async () => {
      mockGetOpportunityById.mockResolvedValue({ ...mockOpportunity, status: 'DRAFT' })

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-status')).toHaveTextContent('DRAFT')
      })
    })

    it('should display FULL status correctly', async () => {
      mockGetOpportunityById.mockResolvedValue({ ...mockOpportunity, status: 'FULL' })

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-status')).toHaveTextContent('FULL')
      })
    })

    it('should display COMPLETED status correctly', async () => {
      mockGetOpportunityById.mockResolvedValue({ ...mockOpportunity, status: 'COMPLETED' })

      render(<OpportunityDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('opportunity-status')).toHaveTextContent('COMPLETED')
      })
    })
  })
})

describe('OpportunityDetailPage Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have route options defined', () => {
    expect(Route.options).toBeDefined()
  })

  it('should have component function', () => {
    expect(Route.options.component).toBeDefined()
  })

  it('should not require authentication (no beforeLoad)', () => {
    // The opportunity detail page is a public route, so no beforeLoad is needed
    expect(Route.options.beforeLoad).toBeUndefined()
  })
})
