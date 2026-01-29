import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationsManagement } from '@/components/opportunity/ApplicationsManagement'
import type { ApplicationResponse } from '@/lib/application'

// Mock the application API
const mockGetApplicationsForOpportunity = vi.fn()
const mockApproveApplication = vi.fn()
const mockRejectApplication = vi.fn()
const mockCompleteApplication = vi.fn()

vi.mock('@/lib/application', async () => {
  const actual = await vi.importActual('@/lib/application')
  return {
    ...actual,
    getApplicationsForOpportunity: (id: number) => mockGetApplicationsForOpportunity(id),
    approveApplication: (id: number) => mockApproveApplication(id),
    rejectApplication: (id: number) => mockRejectApplication(id),
    completeApplication: (id: number) => mockCompleteApplication(id),
  }
})

// Default props for the component - opportunity ended yesterday
const defaultProps = {
  opportunityId: 1,
  maxVolunteers: 10,
  endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  pointsReward: 50,
}

// Props for opportunity that hasn't ended yet
const futureEndDateProps = {
  ...defaultProps,
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
}

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
    message: undefined,
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

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /applications/i })).toBeInTheDocument()
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockGetApplicationsForOpportunity.mockRejectedValue(new Error('Network error'))

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load applications/i)).toBeInTheDocument()
      })
    })

    it('should show try again button on error', async () => {
      mockGetApplicationsForOpportunity.mockRejectedValue(new Error('Network error'))

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show no applications message when list is empty', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([])

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/no applications yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Applications List', () => {
    it('should display applications with volunteer info', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Sample Volunteer')).toBeInTheDocument()
        expect(screen.getByText('Another Volunteer')).toBeInTheDocument()
      })
    })

    it('should display volunteer email', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('volunteer@ua.pt')).toBeInTheDocument()
        expect(screen.getByText('volunteer2@ua.pt')).toBeInTheDocument()
      })
    })

    it('should display application status badges', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
        expect(screen.getByText('Approved')).toBeInTheDocument()
      })
    })

    it('should display application message when present', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/"I would love to help!"/)).toBeInTheDocument()
      })
    })

    it('should display pending count badge', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('1 pending')).toBeInTheDocument()
      })
    })

    it('should display spots filled count', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/1 \/ 10 spots filled/)).toBeInTheDocument()
      })
    })

    it('should display remaining spots', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue(mockApplications)

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/9 remaining/)).toBeInTheDocument()
      })
    })
  })

  describe('Approve/Reject Actions', () => {
    it('should show approve button for pending applications', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]]) // Only pending

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('approve-button')).toBeInTheDocument()
      })
    })

    it('should show reject button for pending applications', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]]) // Only pending

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('reject-button')).toBeInTheDocument()
      })
    })

    it('should not show approve/reject buttons for approved applications', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]]) // Only approved

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Approved')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('approve-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('reject-button')).not.toBeInTheDocument()
    })

    it('should call approveApplication when approve button is clicked', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]])
      mockApproveApplication.mockResolvedValue({ ...mockApplications[0], status: 'APPROVED' })

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

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

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

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

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} maxVolunteers={1} />)

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

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} maxVolunteers={1} />)

      await waitFor(() => {
        expect(screen.getByText(/cannot approve: no spots remaining/i)).toBeInTheDocument()
      })
    })
  })

  describe('Complete Application Actions', () => {
    it('should show complete button for approved applications when opportunity has ended', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]]) // Only approved

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('complete-button')).toBeInTheDocument()
      })
    })

    it('should disable complete button when opportunity has not ended', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]]) // Only approved

      renderWithQueryClient(<ApplicationsManagement {...futureEndDateProps} />)

      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-button')
        expect(completeButton).toBeDisabled()
      })
    })

    it('should show message when opportunity has not ended', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]]) // Only approved

      renderWithQueryClient(<ApplicationsManagement {...futureEndDateProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('complete-disabled-message')).toBeInTheDocument()
        expect(
          screen.getByText(
            /participation can only be marked as completed after the opportunity ends/i,
          ),
        ).toBeInTheDocument()
      })
    })

    it('should call completeApplication when complete button is clicked', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]])
      mockCompleteApplication.mockResolvedValue({
        ...mockApplications[1],
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      })

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('complete-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('complete-button'))

      await waitFor(() => {
        expect(mockCompleteApplication).toHaveBeenCalledWith(2)
      })
    })

    it('should show points in complete button when pointsReward > 0', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]]) // Only approved

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} pointsReward={100} />)

      await waitFor(() => {
        expect(screen.getByTestId('complete-button')).toHaveTextContent(/\+100 pts/)
      })
    })

    it('should not show complete button for pending applications', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]]) // Only pending

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument()
    })

    it('should not show complete button for completed applications', async () => {
      const completedApplication: ApplicationResponse = {
        ...mockApplications[1],
        status: 'COMPLETED',
        completedAt: '2024-02-10T12:00:00Z',
      }
      mockGetApplicationsForOpportunity.mockResolvedValue([completedApplication])

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument()
    })

    it('should show points awarded indicator for completed applications', async () => {
      const completedApplication: ApplicationResponse = {
        ...mockApplications[1],
        status: 'COMPLETED',
        completedAt: '2024-02-10T12:00:00Z',
      }
      mockGetApplicationsForOpportunity.mockResolvedValue([completedApplication])

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} pointsReward={50} />)

      await waitFor(() => {
        expect(screen.getByTestId('points-awarded')).toBeInTheDocument()
        expect(screen.getByText(/\+50 points awarded/i)).toBeInTheDocument()
      })
    })
  })

  describe('Timestamps Display', () => {
    it('should display applied at timestamp', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[0]])

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/applied:/i)).toBeInTheDocument()
      })
    })

    it('should display reviewed at timestamp when present', async () => {
      mockGetApplicationsForOpportunity.mockResolvedValue([mockApplications[1]]) // Has reviewedAt

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/reviewed:/i)).toBeInTheDocument()
      })
    })

    it('should display completed at timestamp when present', async () => {
      const completedApplication: ApplicationResponse = {
        ...mockApplications[1],
        status: 'COMPLETED',
        completedAt: '2024-02-10T12:00:00Z',
      }
      mockGetApplicationsForOpportunity.mockResolvedValue([completedApplication])

      renderWithQueryClient(<ApplicationsManagement {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/completed:/i)).toBeInTheDocument()
      })
    })
  })
})
