import { waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OpportunityPageResponse, OpportunityResponse } from '@/lib/opportunity'
import type { SkillResponse } from '@/lib/profile'
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

// Mock opportunity API
const mockGetOpportunities = vi.fn()

vi.mock('@/lib/opportunity', async () => {
  const actual = await vi.importActual('@/lib/opportunity')
  return {
    ...actual,
    getOpportunities: () => mockGetOpportunities(),
  }
})

// Mock profile API for skills (used by OpportunityFilters)
const mockGetSkills = vi.fn()

vi.mock('@/lib/profile', async () => {
  const actual = await vi.importActual('@/lib/profile')
  return {
    ...actual,
    getSkills: () => mockGetSkills(),
  }
})

const mockSkills: SkillResponse[] = [
  { id: 1, name: 'Communication', category: 'COMMUNICATION', description: 'Communication skills' },
  { id: 2, name: 'Leadership', category: 'LEADERSHIP', description: 'Leadership skills' },
]

// Import after mocks are set up
import { Route } from '@/routes/opportunities/index'

// Get the component from the route
const OpportunitiesPage = Route.options.component as React.ComponentType

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

const mockPageResponse: OpportunityPageResponse = {
  content: [mockOpportunity],
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
}

const emptyPageResponse: OpportunityPageResponse = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 10,
  number: 0,
}

describe('OpportunitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSkills.mockResolvedValue(mockSkills)
  })

  describe('Rendering', () => {
    it('should render page heading', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      expect(
        screen.getByRole('heading', { name: /volunteering opportunities/i }),
      ).toBeInTheDocument()
    })

    it('should render page description', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      expect(
        screen.getByText(/browse available opportunities and find one that matches your skills/i),
      ).toBeInTheDocument()
    })

    it('should have correct container styling', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      const { container } = render(<OpportunitiesPage />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('container', 'mx-auto', 'px-4', 'py-8')
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching opportunities', async () => {
      // Never resolve the promise to keep loading state
      mockGetOpportunities.mockReturnValue(new Promise(() => {}))

      render(<OpportunitiesPage />)

      expect(
        screen.getByRole('heading', { name: /volunteering opportunities/i }),
      ).toBeInTheDocument()
      // Loader should be visible
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state message when no opportunities', async () => {
      mockGetOpportunities.mockResolvedValue(emptyPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/no opportunities available at the moment/i)).toBeInTheDocument()
      })
    })

    it('should show helpful message in empty state', async () => {
      mockGetOpportunities.mockResolvedValue(emptyPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(
          screen.getByText(/check back later for new volunteering opportunities/i),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Opportunities List', () => {
    it('should display opportunity cards when opportunities exist', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText('UA Open Day Support')).toBeInTheDocument()
      })
    })

    it('should display opportunity description', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/help with university open day activities/i)).toBeInTheDocument()
      })
    })

    it('should display opportunity location', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText('University Campus')).toBeInTheDocument()
      })
    })

    it('should display points reward', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/50 points/i)).toBeInTheDocument()
      })
    })

    it('should display max volunteers', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/max 10 volunteers/i)).toBeInTheDocument()
      })
    })

    it('should display required skills', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Communication')).toBeInTheDocument()
        expect(screen.getByText('Leadership')).toBeInTheDocument()
      })
    })

    it('should show results count', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/showing 1 of 1 opportunities/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockGetOpportunities.mockRejectedValue(new Error('Network error'))

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load opportunities/i)).toBeInTheDocument()
      })
    })

    it('should show error details', async () => {
      mockGetOpportunities.mockRejectedValue(new Error('Network error'))

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      mockGetOpportunities.mockRejectedValue(new Error('Network error'))

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should show pagination when multiple pages exist', async () => {
      const multiPageResponse: OpportunityPageResponse = {
        content: [mockOpportunity],
        totalElements: 25,
        totalPages: 3,
        size: 10,
        number: 0,
      }
      mockGetOpportunities.mockResolvedValue(multiPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
      })
    })

    it('should show previous and next buttons', async () => {
      const multiPageResponse: OpportunityPageResponse = {
        content: [mockOpportunity],
        totalElements: 25,
        totalPages: 3,
        size: 10,
        number: 0,
      }
      mockGetOpportunities.mockResolvedValue(multiPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      })
    })

    it('should disable previous button on first page', async () => {
      const firstPageResponse: OpportunityPageResponse = {
        content: [mockOpportunity],
        totalElements: 25,
        totalPages: 3,
        size: 10,
        number: 0,
      }
      mockGetOpportunities.mockResolvedValue(firstPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
      })
    })

    it('should not show pagination when only one page', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByText('UA Open Day Support')).toBeInTheDocument()
      })

      // Pagination should not be visible
      expect(screen.queryByText(/page 1 of 1/i)).not.toBeInTheDocument()
    })
  })

  describe('Filters', () => {
    it('should render filter toggle button', async () => {
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      expect(screen.getByTestId('filter-toggle')).toBeInTheDocument()
    })

    it('should expand filter panel when clicking toggle', async () => {
      const user = userEvent.setup()
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filters-panel')).toBeInTheDocument()
      })
    })

    it('should show filter by skills section when expanded', async () => {
      const user = userEvent.setup()
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByText('Filter by Skills')).toBeInTheDocument()
      })
    })

    it('should show date filter inputs when expanded', async () => {
      const user = userEvent.setup()
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-start-date-from')).toBeInTheDocument()
        expect(screen.getByTestId('filter-start-date-to')).toBeInTheDocument()
      })
    })

    it('should show points filter inputs when expanded', async () => {
      const user = userEvent.setup()
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-min-points')).toBeInTheDocument()
        expect(screen.getByTestId('filter-max-points')).toBeInTheDocument()
      })
    })

    it('should show skills from API in filter panel', async () => {
      const user = userEvent.setup()
      mockGetOpportunities.mockResolvedValue(mockPageResponse)

      render(<OpportunitiesPage />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('skill-filter-1')).toBeInTheDocument()
        expect(screen.getByTestId('skill-filter-2')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State with Filters', () => {
    it('should show filter-specific empty message when filters are active', async () => {
      const user = userEvent.setup()
      mockGetOpportunities.mockResolvedValue(emptyPageResponse)

      render(<OpportunitiesPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })

      // Apply a filter by clicking a skill
      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('skill-filter-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('skill-filter-1'))

      await waitFor(() => {
        expect(screen.getByText(/no opportunities match your filters/i)).toBeInTheDocument()
      })
    })

    it('should show clear filters button in empty state when filters are active', async () => {
      const user = userEvent.setup()
      mockGetOpportunities.mockResolvedValue(emptyPageResponse)

      render(<OpportunitiesPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })

      // Apply a filter
      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('skill-filter-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('skill-filter-1'))

      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-empty')).toBeInTheDocument()
      })
    })

    it('should not show clear filters button when no filters active', async () => {
      mockGetOpportunities.mockResolvedValue(emptyPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('clear-filters-empty')).not.toBeInTheDocument()
    })

    it('should show adjust filter criteria message when filters active', async () => {
      const user = userEvent.setup()
      mockGetOpportunities.mockResolvedValue(emptyPageResponse)

      render(<OpportunitiesPage />)

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })

      // Apply a filter
      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('skill-filter-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('skill-filter-1'))

      await waitFor(() => {
        expect(screen.getByText(/try adjusting your filter criteria/i)).toBeInTheDocument()
      })
    })
  })
})

describe('OpportunitiesPage Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSkills.mockResolvedValue(mockSkills)
  })

  it('should have route options defined', () => {
    expect(Route.options).toBeDefined()
  })

  it('should have component function', () => {
    expect(Route.options.component).toBeDefined()
  })

  it('should not require authentication (no beforeLoad)', () => {
    // The opportunities list is a public route, so no beforeLoad is needed
    expect(Route.options.beforeLoad).toBeUndefined()
  })
})
