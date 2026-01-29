import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationsManagement } from '@/components/opportunity/ApplicationsManagement'
import type { ApplicationResponse } from '@/lib/application'

// Mock the application API
const mockGetApplicationsForOpportunity = vi.fn()
const mockApproveApplication = vi.fn()
const mockRejectApplication = vi.fn()

vi.mock('@/lib/application', async () => {
  const actual = await vi.importActual('@/lib/application')
  return {
    ...actual,
    getApplicationsForOpportunity: (id: number) => mockGetApplicationsForOpportunity(id),
    approveApplication: (id: number) => mockApproveApplication(id),
    rejectApplication: (id: number) => mockRejectApplication(id),
  }
})

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
      name: 'Sample Volunteer',
      role: 'VOLUNTEER',
      points: 0,
    },
  },
  {
    id: 2,
    status: 'APPROVED',
    message: null,
    appliedAt: '2024-01-10T14:00:00Z',
    reviewedAt: '2024-01-11T10:00:00Z',
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
      id: 2,
      email: 'volunteer2@ua.pt',
      name: 'Another Volunteer',
      role: 'VOLUNTEER',
      points: 100,
    },
  },
]

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = createQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ApplicationsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching applications', async () => {
      mockGetApplicationsForOpportunity.mockReturnValue(new Promise(() => {}))

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      expect(screen.getByRole('heading', { name: /applications/i })).toBeInTheDocument()
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockGetApplicationsForOpportunity.mockRejectedValue(new Error('Network error'))

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load applications/i)).toBeInTheDocument()
      })
    })

    it('should show try again button on error', async () => {
      mockGetApplicationsForOpportunity.mockRejectedValue(new Error('Network error'))

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show no applications message when list is empty', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([])

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText(/no applications yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Applications List', () => {
    it('should display applications with volunteer info', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText('Sample Volunteer')).toBeInTheDocument()
        expect(screen.getByText('Another Volunteer')).toBeInTheDocument()
      })
    })

    it('should display volunteer email', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText('volunteer@ua.pt')).toBeInTheDocument()
        expect(screen.getByText('volunteer2@ua.pt')).toBeInTheDocument()
      })
    })

    it('should display application status badges', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
        expect(screen.getByText('Approved')).toBeInTheDocument()
      })
    })

    it('should display application message when present', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText(/"I would love to help!"/)).toBeInTheDocument()
      })
    })

    it('should display pending count badge', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText('1 pending')).toBeInTheDocument()
      })
    })

    it('should display spots filled count', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText(/1 \/ 10 spots filled/)).toBeInTheDocument()
      })
    })

    it('should display remaining spots', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText(/9 remaining/)).toBeInTheDocument()
      })
    })
  })

  describe('Approve/Reject Actions', () => {
    it('should show approve button for pending applications', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]]) // Only pending

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByTestId('approve-button')).toBeInTheDocument()
      })
    })

    it('should show reject button for pending applications', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]]) // Only pending

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByTestId('reject-button')).toBeInTheDocument()
      })
    })

    it('should not show approve/reject buttons for approved applications', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]]) // Only approved

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText('Approved')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('approve-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('reject-button')).not.toBeInTheDocument()
    })

    it('should call approveApplication when approve button is clicked', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]])
      mockApproveApplication.mockResolvedValue({ ...mockApplications[0], status: 'APPROVED' })

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByTestId('approve-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('approve-button'))

      await waitFor(() => {
        expect(mockApproveApplication).toHaveBeenCalledWith(1)
      })
    })

    it('should call rejectApplication when reject button is clicked', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]])
      mockRejectApplication.mockResolvedValue({ ...mockApplications[0], status: 'REJECTED' })

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByTestId('reject-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('reject-button'))

      await waitFor(() => {
        expect(mockRejectApplication).toHaveBeenCalledWith(1)
      })
    })

    it('should disable approve button when no spots remaining', async () => {
      const approvedApplications = [
        { ...mockApplications[1], id: 1 },
        { ...mockApplications[0], id: 2 }, // pending
      ]
      mockGetApplicationsForOpportunity.mockResolvedValue(approvedApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={1} />)

      await waitFor(() => {
        const approveButton = screen.getByTestId('approve-button')
        expect(approveButton).toBeDisabled()
      })
    })

    it('should show warning message when no spots remaining', async () => {
      const approvedApplications = [
        { ...mockApplications[1], id: 1 },
        { ...mockApplications[0], id: 2 }, // pending
      ]
      mockGetApplicationsForOpportunity.mockResolvedValue(approvedApplications)

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={1} />)

      await waitFor(() => {
        expect(screen.getByText(/cannot approve: no spots remaining/i)).toBeInTheDocument()
      })
    })
  })

  describe('Timestamps Display', () => {
    it('should display applied at timestamp', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]])

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText(/applied:/i)).toBeInTheDocument()
      })
    })

    it('should display reviewed at timestamp when present', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]]) // Has reviewedAt

      renderWithQueryClient(<ApplicationsManagement opportunityId={1} maxVolunteers={10} />)

      await waitFor(() => {
        expect(screen.getByText(/reviewed:/i)).toBeInTheDocument()
      })
    })
  })
})
