import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the reward API
const mockGetMyRedemptions = vi.fn()

vi.mock('@/lib/reward', async () => {
  const actual = await vi.importActual('@/lib/reward')
  return {
    ...actual,
    getMyRedemptions: () => mockGetMyRedemptions(),
  }
})

// Mock auth functions
const mockGetAuthToken = vi.fn()
const mockIsVolunteer = vi.fn()

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual('@/lib/auth')
  return {
    ...actual,
    getAuthToken: () => mockGetAuthToken(),
    isVolunteer: () => mockIsVolunteer(),
  }
})

// Mock useAuth hook
let mockUser: { id: number; email: string; name: string; role: string; points?: number } | null =
  null

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}))

// Mock TanStack Router
const mockRedirect = vi.fn()

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({
      children,
      to,
      params,
      className,
      ...props
    }: {
      children: React.ReactNode
      to: string
      params?: Record<string, string>
      className?: string
    }) => {
      let href = to
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          href = href.replace(`$${key}`, value)
        })
      }
      return (
        <a href={href} className={className} {...props}>
          {children}
        </a>
      )
    },
    createFileRoute:
      (_path: string) =>
      (options: { beforeLoad?: () => void; component: React.ComponentType }) => ({
        options,
        useParams: () => ({}),
      }),
    redirect: (options: { to: string; search?: Record<string, string> }) => {
      mockRedirect(options)
      throw new Error(`Redirect to ${options.to}`)
    },
  }
})

// Import the route after mocks
import { Route as MyRedemptionsRoute } from '@/routes/rewards/my-redemptions'

// Sample redemption data
const mockRedemptions = [
  {
    id: 1,
    code: 'ABC123XYZ',
    pointsSpent: 50,
    redeemedAt: '2024-01-15T10:30:00Z',
    usedAt: null,
    reward: {
      id: 1,
      title: 'Free Coffee',
      type: 'PARTNER_VOUCHER' as const,
      partnerName: 'UA Cafeteria',
    },
  },
  {
    id: 2,
    code: 'DEF456UVW',
    pointsSpent: 100,
    redeemedAt: '2024-01-20T14:00:00Z',
    usedAt: '2024-01-21T09:00:00Z',
    reward: {
      id: 2,
      title: 'Library Pass',
      type: 'UA_SERVICE' as const,
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

// Get the actual component from the route
const MyRedemptionsPage = MyRedemptionsRoute.options.component!

function renderPage() {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MyRedemptionsPage />
    </QueryClientProvider>,
  )
}

describe('My Redemptions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMyRedemptions.mockResolvedValue(mockRedemptions)
    mockGetAuthToken.mockReturnValue('valid-token')
    mockIsVolunteer.mockReturnValue(true)
    mockUser = {
      id: 1,
      email: 'volunteer@ua.pt',
      name: 'Test Volunteer',
      role: 'VOLUNTEER',
      points: 150,
    }
  })

  describe('beforeLoad guard', () => {
    it('should redirect to login when not authenticated', () => {
      mockGetAuthToken.mockReturnValue(null)

      expect(() => {
        MyRedemptionsRoute.options.beforeLoad?.({} as never)
      }).toThrow()

      expect(mockRedirect).toHaveBeenCalledWith({ to: '/login' })
    })

    it('should redirect to home with forbidden error when not a volunteer', () => {
      mockGetAuthToken.mockReturnValue('valid-token')
      mockIsVolunteer.mockReturnValue(false)

      expect(() => {
        MyRedemptionsRoute.options.beforeLoad?.({} as never)
      }).toThrow()

      expect(mockRedirect).toHaveBeenCalledWith({ to: '/', search: { error: 'forbidden' } })
    })

    it('should not redirect when user is authenticated volunteer', () => {
      mockGetAuthToken.mockReturnValue('valid-token')
      mockIsVolunteer.mockReturnValue(true)

      expect(() => {
        MyRedemptionsRoute.options.beforeLoad?.({} as never)
      }).not.toThrow()

      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('Page header', () => {
    it('should render page title', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('My Redemptions')).toBeInTheDocument()
      })
    })

    it('should render page description', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('View your redeemed rewards and codes')).toBeInTheDocument()
      })
    })

    it('should display current points balance', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Current Balance')).toBeInTheDocument()
        expect(screen.getByText('150 pts')).toBeInTheDocument()
      })
    })

    it('should display 0 points when user has no points', async () => {
      mockUser = { ...mockUser!, points: undefined }
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('0 pts')).toBeInTheDocument()
      })
    })

    it('should render Browse Rewards link', async () => {
      renderPage()

      await waitFor(() => {
        const browseLink = screen.getByRole('link', { name: 'Browse Rewards' })
        expect(browseLink).toBeInTheDocument()
        expect(browseLink).toHaveAttribute('href', '/rewards')
      })
    })
  })

  describe('Loading state', () => {
    it('should show loading spinner while fetching', async () => {
      mockGetMyRedemptions.mockReturnValue(new Promise(() => {})) // Never resolves
      renderPage()

      // The Loader2 icon has animate-spin class
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
    })
  })

  describe('Error state', () => {
    it('should show error message on API failure', async () => {
      mockGetMyRedemptions.mockRejectedValue(new Error('Network error'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Failed to load redemptions')).toBeInTheDocument()
      })
    })

    it('should show error details from Error object', async () => {
      mockGetMyRedemptions.mockRejectedValue(new Error('Connection timeout'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Connection timeout')).toBeInTheDocument()
      })
    })

    it('should show generic message for non-Error errors', async () => {
      mockGetMyRedemptions.mockRejectedValue('String error')
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('An error occurred')).toBeInTheDocument()
      })
    })

    it('should show Try Again button on error', async () => {
      mockGetMyRedemptions.mockRejectedValue(new Error('API Error'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
      })
    })

    it('should refetch when Try Again is clicked', async () => {
      mockGetMyRedemptions.mockRejectedValueOnce(new Error('API Error'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
      })

      mockGetMyRedemptions.mockResolvedValue(mockRedemptions)
      fireEvent.click(screen.getByRole('button', { name: /Try Again/ }))

      await waitFor(() => {
        expect(mockGetMyRedemptions).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Empty state', () => {
    it('should show empty message when no redemptions', async () => {
      mockGetMyRedemptions.mockResolvedValue([])
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('No redemptions yet')).toBeInTheDocument()
      })
    })

    it('should show helpful description in empty state', async () => {
      mockGetMyRedemptions.mockResolvedValue([])
      renderPage()

      await waitFor(() => {
        expect(
          screen.getByText('Browse rewards and redeem your points for valuable benefits'),
        ).toBeInTheDocument()
      })
    })

    it('should show Browse Rewards button in empty state', async () => {
      mockGetMyRedemptions.mockResolvedValue([])
      renderPage()

      await waitFor(() => {
        const buttons = screen.getAllByRole('link', { name: 'Browse Rewards' })
        expect(buttons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Redemptions list', () => {
    it('should render all redemptions', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Free Coffee')).toBeInTheDocument()
        expect(screen.getByText('Library Pass')).toBeInTheDocument()
      })
    })

    it('should display redemption codes', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
        expect(screen.getByText('DEF456UVW')).toBeInTheDocument()
      })
    })

    it('should display points spent for each redemption', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
      })
    })

    it('should display reward type badges', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Partner Voucher')).toBeInTheDocument()
        expect(screen.getByText('UA Service')).toBeInTheDocument()
      })
    })

    it('should display partner name when available', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('UA Cafeteria')).toBeInTheDocument()
      })
    })

    it('should not display partner section when no partner', async () => {
      mockGetMyRedemptions.mockResolvedValue([mockRedemptions[1]]) // Library Pass has no partner
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Library Pass')).toBeInTheDocument()
      })
      expect(screen.queryByText('Partner')).not.toBeInTheDocument()
    })

    it('should render View Reward Details link for each redemption', async () => {
      renderPage()

      await waitFor(() => {
        const detailLinks = screen.getAllByRole('link', { name: 'View Reward Details' })
        expect(detailLinks).toHaveLength(2)
        expect(detailLinks[0]).toHaveAttribute('href', '/rewards/1')
        expect(detailLinks[1]).toHaveAttribute('href', '/rewards/2')
      })
    })
  })

  describe('Copy code functionality', () => {
    it('should have copy button for each redemption', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      // Each redemption card has a copy button next to the code
      // Find buttons that contain the Copy icon by looking for small ghost buttons
      const allButtons = screen.getAllByRole('button')
      // Filter to buttons that are not "View Reward Details" or "Browse Rewards" or "Try Again"
      const copyButtons = allButtons.filter(
        (btn) =>
          !btn.textContent?.includes('View') &&
          !btn.textContent?.includes('Browse') &&
          !btn.textContent?.includes('Try'),
      )
      expect(copyButtons.length).toBe(2) // One per redemption
    })

    it('should copy code to clipboard when copy button is clicked', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      // Find copy buttons by filtering out named buttons
      const allButtons = screen.getAllByRole('button')
      const copyButtons = allButtons.filter(
        (btn) =>
          !btn.textContent?.includes('View') &&
          !btn.textContent?.includes('Browse') &&
          !btn.textContent?.includes('Try'),
      )
      fireEvent.click(copyButtons[0])

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('ABC123XYZ')
      })
    })

    it('should show "Copied!" message after copying', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      const allButtons = screen.getAllByRole('button')
      const copyButtons = allButtons.filter(
        (btn) =>
          !btn.textContent?.includes('View') &&
          !btn.textContent?.includes('Browse') &&
          !btn.textContent?.includes('Try'),
      )
      fireEvent.click(copyButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    it('should handle clipboard API failure gracefully', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard not available'))
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      const allButtons = screen.getAllByRole('button')
      const copyButtons = allButtons.filter(
        (btn) =>
          !btn.textContent?.includes('View') &&
          !btn.textContent?.includes('Browse') &&
          !btn.textContent?.includes('Try'),
      )

      // Should not throw - just click and verify no crash
      fireEvent.click(copyButtons[0])

      // Component should still be functional after error
      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })
    })
  })

  describe('Date formatting', () => {
    it('should format redemption dates correctly', async () => {
      renderPage()

      await waitFor(() => {
        // The date should be formatted as "Jan 15, 2024, XX:XX AM/PM"
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
        expect(screen.getByText(/Jan 20, 2024/)).toBeInTheDocument()
      })
    })
  })

  describe('Reward types', () => {
    it('should display correct label for PARTNER_VOUCHER type', async () => {
      mockGetMyRedemptions.mockResolvedValue([mockRedemptions[0]])
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Partner Voucher')).toBeInTheDocument()
      })
    })

    it('should display correct label for UA_SERVICE type', async () => {
      mockGetMyRedemptions.mockResolvedValue([mockRedemptions[1]])
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('UA Service')).toBeInTheDocument()
      })
    })

    it('should display correct label for MERCHANDISE type', async () => {
      mockGetMyRedemptions.mockResolvedValue([
        {
          ...mockRedemptions[0],
          reward: { ...mockRedemptions[0].reward, type: 'MERCHANDISE' },
        },
      ])
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Merchandise')).toBeInTheDocument()
      })
    })

    it('should display correct label for CERTIFICATE type', async () => {
      mockGetMyRedemptions.mockResolvedValue([
        {
          ...mockRedemptions[0],
          reward: { ...mockRedemptions[0].reward, type: 'CERTIFICATE' },
        },
      ])
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Certificate')).toBeInTheDocument()
      })
    })

    it('should display correct label for OTHER type', async () => {
      mockGetMyRedemptions.mockResolvedValue([
        {
          ...mockRedemptions[0],
          reward: { ...mockRedemptions[0].reward, type: 'OTHER' },
        },
      ])
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Other')).toBeInTheDocument()
      })
    })
  })

  describe('API calls', () => {
    it('should call getMyRedemptions on mount', async () => {
      renderPage()

      await waitFor(() => {
        expect(mockGetMyRedemptions).toHaveBeenCalled()
      })
    })
  })

  describe('Layout sections', () => {
    it('should show Redemption Code label', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getAllByText('Redemption Code')).toHaveLength(2)
      })
    })

    it('should show Points spent label', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getAllByText('Points spent')).toHaveLength(2)
      })
    })

    it('should show Redeemed on label', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getAllByText('Redeemed on')).toHaveLength(2)
      })
    })
  })
})
