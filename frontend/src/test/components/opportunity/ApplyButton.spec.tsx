import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplyButton } from '@/components/opportunity/ApplyButton'
import type { ApplicationResponse } from '@/lib/application'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
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

// Mock the application API
vi.mock('@/lib/application', async () => {
  const actual = await vi.importActual('@/lib/application')
  return {
    ...actual,
    applyToOpportunity: vi.fn(),
    parseApplicationError: vi.fn().mockResolvedValue('An error occurred'),
  }
})

// Mock the auth context
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

import { useAuth } from '@/contexts/AuthContext'
import { applyToOpportunity, parseApplicationError } from '@/lib/application'

const mockApplication: ApplicationResponse = {
  id: 1,
  status: 'PENDING',
  message: 'I would love to help!',
  appliedAt: '2024-01-15T10:00:00Z',
  opportunity: {
    id: 1,
    title: 'Test Opportunity',
    status: 'OPEN',
    startDate: '2024-02-01T09:00:00Z',
    endDate: '2024-02-07T17:00:00Z',
    pointsReward: 50,
    location: 'Test Location',
  },
  volunteer: {
    id: 1,
    email: 'volunteer@ua.pt',
    name: 'Volunteer',
    role: 'VOLUNTEER',
    points: 0,
  },
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('ApplyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user is not logged in', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        setUser: vi.fn(),
        logout: vi.fn(),
        refreshPoints: vi.fn(),
      })
    })

    it('should show login prompt', () => {
      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={0}
          existingApplication={null}
        />,
        { wrapper: createWrapper() },
      )

      expect(screen.getByTestId('apply-login-prompt')).toBeInTheDocument()
      expect(screen.getByText('Login to Apply')).toBeInTheDocument()
    })
  })

  describe('when user is not a volunteer', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 1, email: 'promoter@ua.pt', name: 'Promoter', role: 'PROMOTER' },
        isLoading: false,
        setUser: vi.fn(),
        logout: vi.fn(),
        refreshPoints: vi.fn(),
      })
    })

    it('should not render anything', () => {
      const { container } = render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={0}
          existingApplication={null}
        />,
        { wrapper: createWrapper() },
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when user is a volunteer', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' },
        isLoading: false,
        setUser: vi.fn(),
        logout: vi.fn(),
        refreshPoints: vi.fn(),
      })
    })

    it('should show apply button when opportunity is open and has spots', () => {
      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={5}
          existingApplication={null}
        />,
        { wrapper: createWrapper() },
      )

      expect(screen.getByTestId('apply-section')).toBeInTheDocument()
      expect(screen.getByTestId('apply-button')).toBeInTheDocument()
      expect(screen.getByText('5 spots remaining')).toBeInTheDocument()
    })

    it('should show application status when already applied', () => {
      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={5}
          existingApplication={mockApplication}
        />,
        { wrapper: createWrapper() },
      )

      expect(screen.getByTestId('application-status')).toBeInTheDocument()
      expect(screen.getByText('You have applied')).toBeInTheDocument()
      expect(screen.getByTestId('status-badge')).toHaveTextContent('Pending')
    })

    it('should show no spots available when opportunity is full', () => {
      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={10}
          existingApplication={null}
        />,
        { wrapper: createWrapper() },
      )

      expect(screen.getByTestId('no-spots-available')).toBeInTheDocument()
      expect(screen.getByText('No Spots Available')).toBeInTheDocument()
    })

    it('should show not available when opportunity is not open', () => {
      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="DRAFT"
          maxVolunteers={10}
          approvedCount={0}
          existingApplication={null}
        />,
        { wrapper: createWrapper() },
      )

      expect(screen.getByTestId('opportunity-not-open')).toBeInTheDocument()
      expect(screen.getByText('Not Available')).toBeInTheDocument()
    })

    it('should call applyToOpportunity when apply button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(applyToOpportunity).mockResolvedValue(mockApplication)

      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={0}
          existingApplication={null}
        />,
        { wrapper: createWrapper() },
      )

      await user.click(screen.getByTestId('apply-button'))

      await waitFor(() => {
        expect(applyToOpportunity).toHaveBeenCalledWith(1)
      })
    })

    it('should show error message on API error', async () => {
      const user = userEvent.setup()
      vi.mocked(applyToOpportunity).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseApplicationError).mockResolvedValue('Already applied')

      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={0}
          existingApplication={null}
        />,
        { wrapper: createWrapper() },
      )

      await user.click(screen.getByTestId('apply-button'))

      await waitFor(() => {
        expect(screen.getByTestId('apply-error')).toHaveTextContent('Already applied')
      })
    })

    it('should call onApplicationSuccess callback after successful application', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      vi.mocked(applyToOpportunity).mockResolvedValue(mockApplication)

      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={0}
          existingApplication={null}
          onApplicationSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() },
      )

      await user.click(screen.getByTestId('apply-button'))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockApplication)
      })
    })

    it('should show loading state while applying', async () => {
      const user = userEvent.setup()
      let resolveApply: (value: ApplicationResponse) => void
      const applyPromise = new Promise<ApplicationResponse>((resolve) => {
        resolveApply = resolve
      })
      vi.mocked(applyToOpportunity).mockReturnValue(applyPromise)

      render(
        <ApplyButton
          opportunityId={1}
          opportunityStatus="OPEN"
          maxVolunteers={10}
          approvedCount={0}
          existingApplication={null}
        />,
        { wrapper: createWrapper() },
      )

      await user.click(screen.getByTestId('apply-button'))

      expect(screen.getByTestId('apply-button')).toHaveTextContent('Applying...')
      expect(screen.getByTestId('apply-button')).toBeDisabled()

      // Resolve the promise
      resolveApply!(mockApplication)

      await waitFor(() => {
        expect(screen.getByTestId('application-status')).toBeInTheDocument()
      })
    })
  })
})
