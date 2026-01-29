import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OpportunityPageResponse } from '@/lib/opportunity'

// Mock TanStack Router
const mockRedirect = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    (_path: string) =>
    (options: {
      beforeLoad?: () => void
      component: React.ComponentType
    }) => ({
      ...options,
      options,
    }),
  Link: ({
    children,
    to,
    className,
    params,
  }: {
    children: React.ReactNode
    to: string
    className?: string
    params?: Record<string, string>
  }) => {
    const href = params ? to.replace('$opportunityId', params.opportunityId) : to
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  },
  redirect: (options: { to: string; search?: Record<string, string> }) => {
    mockRedirect(options)
    throw new Error('Redirect')
  },
}))

// Mock auth functions
const mockGetAuthToken = vi.fn()
const mockIsAdmin = vi.fn()

vi.mock('@/lib/auth', () => ({
  getAuthToken: () => mockGetAuthToken(),
  isAdmin: () => mockIsAdmin(),
}))

// Mock opportunity API
const mockGetAdminOpportunities = vi.fn()
const mockPublishOpportunity = vi.fn()
const mockCancelOpportunity = vi.fn()

vi.mock('@/lib/opportunity', async () => {
  const actual = await vi.importActual('@/lib/opportunity')
  return {
    ...actual,
    getAdminOpportunities: (params: unknown) => mockGetAdminOpportunities(params),
    publishOpportunity: (id: number) => mockPublishOpportunity(id),
    cancelOpportunity: (id: number) => mockCancelOpportunity(id),
  }
})

// Import after mocks are set up
import { Route } from '@/routes/admin/opportunities'

// Get the component from the route
const OpportunitiesPage = Route.options.component as React.ComponentType
const beforeLoad = Route.options.beforeLoad as () => void

const mockOpportunity = {
  id: 1,
  title: 'Test Opportunity',
  description: 'Test description',
  pointsReward: 50,
  startDate: '2024-02-01T09:00:00Z',
  endDate: '2024-02-07T17:00:00Z',
  maxVolunteers: 10,
  status: 'DRAFT' as const,
  location: 'University Campus',
  promoter: {
    id: 1,
    email: 'promoter@ua.pt',
    name: 'Promoter User',
    role: 'PROMOTER' as const,
    points: 0,
    createdAt: '2024-01-01T00:00:00Z',
  },
  requiredSkills: [],
  createdAt: '2024-01-15T00:00:00Z',
}

const mockPageResponse: OpportunityPageResponse = {
  content: [mockOpportunity],
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderWithQueryClient() {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <OpportunitiesPage />
    </QueryClientProvider>,
  )
}

describe('Admin Opportunities Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAdminOpportunities.mockResolvedValue(mockPageResponse)
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

  describe('rendering', () => {
    it('should render the page heading', async () => {
      renderWithQueryClient()

      expect(screen.getByRole('heading', { name: /manage opportunities/i })).toBeInTheDocument()
    })

    it('should render the description text', async () => {
      renderWithQueryClient()

      expect(screen.getByText(/view and manage all opportunities/i)).toBeInTheDocument()
    })

    it('should render Back to Dashboard button', async () => {
      renderWithQueryClient()

      const backLink = screen.getByRole('link', { name: /back to dashboard/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/admin')
    })

    it('should render status filter dropdown', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('loading state', () => {
    it('should show loading spinner while fetching', async () => {
      mockGetAdminOpportunities.mockReturnValue(new Promise(() => {}))

      renderWithQueryClient()

      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('opportunities table', () => {
    it('should display opportunities in table', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText('Test Opportunity')).toBeInTheDocument()
      })
    })

    it('should display promoter name', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText('Promoter User')).toBeInTheDocument()
      })
    })

    it('should display opportunity status badge', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText('DRAFT')).toBeInTheDocument()
      })
    })

    it('should display points reward', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument()
      })
    })

    it('should show total count', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText(/1 total opportunities/i)).toBeInTheDocument()
      })
    })

    it('should have view button linking to opportunity detail', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        const viewLink = screen.getByRole('link', { name: '' })
        expect(viewLink).toHaveAttribute('href', '/opportunities/1')
      })
    })
  })

  describe('empty state', () => {
    it('should show message when no opportunities', async () => {
      mockGetAdminOpportunities.mockResolvedValue({
        ...mockPageResponse,
        content: [],
        totalElements: 0,
      })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText(/no opportunities found/i)).toBeInTheDocument()
      })
    })

    it('should show filter message when no results match filter', async () => {
      mockGetAdminOpportunities.mockResolvedValue({
        ...mockPageResponse,
        content: [],
        totalElements: 0,
      })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      // Select a status filter
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DRAFT' } })

      await waitFor(() => {
        expect(screen.getByText(/no opportunities match your filter/i)).toBeInTheDocument()
      })
    })
  })

  describe('error state', () => {
    it('should show error message when fetch fails', async () => {
      mockGetAdminOpportunities.mockRejectedValue(new Error('Failed to load'))

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText(/failed to load opportunities/i)).toBeInTheDocument()
      })
    })
  })

  describe('status filter', () => {
    it('should filter by DRAFT status', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DRAFT' } })

      await waitFor(() => {
        expect(mockGetAdminOpportunities).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'DRAFT' }),
        )
      })
    })

    it('should show Clear button when filter is active', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'OPEN' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
      })
    })

    it('should clear filter when Clear button is clicked', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'OPEN' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /clear/i }))

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('publish action', () => {
    it('should show publish button for DRAFT opportunities', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByTitle('Publish')).toBeInTheDocument()
      })
    })

    it('should not show publish button for non-DRAFT opportunities', async () => {
      mockGetAdminOpportunities.mockResolvedValue({
        ...mockPageResponse,
        content: [{ ...mockOpportunity, status: 'OPEN' }],
      })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText('Test Opportunity')).toBeInTheDocument()
      })

      expect(screen.queryByTitle('Publish')).not.toBeInTheDocument()
    })

    it('should call publishOpportunity when publish button is clicked', async () => {
      mockPublishOpportunity.mockResolvedValue({ ...mockOpportunity, status: 'OPEN' })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByTitle('Publish')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTitle('Publish'))

      await waitFor(() => {
        expect(mockPublishOpportunity).toHaveBeenCalledWith(1)
      })
    })

    it('should show success notification after publishing', async () => {
      mockPublishOpportunity.mockResolvedValue({ ...mockOpportunity, status: 'OPEN', title: 'Test Opportunity' })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByTitle('Publish')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTitle('Publish'))

      await waitFor(() => {
        expect(screen.getByText(/successfully published/i)).toBeInTheDocument()
      })
    })
  })

  describe('cancel action', () => {
    it('should show cancel button for DRAFT opportunities', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByTitle('Cancel')).toBeInTheDocument()
      })
    })

    it('should show cancel button for OPEN opportunities', async () => {
      mockGetAdminOpportunities.mockResolvedValue({
        ...mockPageResponse,
        content: [{ ...mockOpportunity, status: 'OPEN' }],
      })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByTitle('Cancel')).toBeInTheDocument()
      })
    })

    it('should not show cancel button for COMPLETED opportunities', async () => {
      mockGetAdminOpportunities.mockResolvedValue({
        ...mockPageResponse,
        content: [{ ...mockOpportunity, status: 'COMPLETED' }],
      })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText('Test Opportunity')).toBeInTheDocument()
      })

      expect(screen.queryByTitle('Cancel')).not.toBeInTheDocument()
    })

    it('should call cancelOpportunity when cancel button is clicked', async () => {
      mockCancelOpportunity.mockResolvedValue({ ...mockOpportunity, status: 'CANCELLED' })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByTitle('Cancel')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTitle('Cancel'))

      await waitFor(() => {
        expect(mockCancelOpportunity).toHaveBeenCalledWith(1)
      })
    })

    it('should show success notification after cancelling', async () => {
      mockCancelOpportunity.mockResolvedValue({ ...mockOpportunity, status: 'CANCELLED', title: 'Test Opportunity' })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByTitle('Cancel')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTitle('Cancel'))

      await waitFor(() => {
        expect(screen.getByText(/successfully cancelled/i)).toBeInTheDocument()
      })
    })
  })

  describe('pagination', () => {
    it('should not show pagination for single page', async () => {
      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByText('Test Opportunity')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    })

    it('should show pagination for multiple pages', async () => {
      mockGetAdminOpportunities.mockResolvedValue({
        ...mockPageResponse,
        totalPages: 3,
        totalElements: 25,
      })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      })
    })

    it('should disable Previous button on first page', async () => {
      mockGetAdminOpportunities.mockResolvedValue({
        ...mockPageResponse,
        totalPages: 3,
        number: 0,
      })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
      })
    })

    it('should disable Next button on last page', async () => {
      mockGetAdminOpportunities.mockResolvedValue({
        ...mockPageResponse,
        totalPages: 3,
        number: 2,
      })

      renderWithQueryClient()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
      })
    })
  })
})
