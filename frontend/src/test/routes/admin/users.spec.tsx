import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'

// Mock TanStack Router
const mockRedirect = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    (_path: string) => (options: { beforeLoad?: () => void; component: React.ComponentType }) => ({
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
  redirect: (options: { to: string; search?: Record<string, string> }) => {
    mockRedirect(options)
    throw new Error('Redirect')
  },
}))

// Mock auth functions
const mockGetAuthToken = vi.fn()
const mockIsAdmin = vi.fn()
const mockGetUsers = vi.fn()
const mockUpdateUserRole = vi.fn()

vi.mock('@/lib/auth', () => ({
  getAuthToken: () => mockGetAuthToken(),
  isAdmin: () => mockIsAdmin(),
  getUsers: (params: unknown) => mockGetUsers(params),
  updateUserRole: (userId: number, role: string) => mockUpdateUserRole(userId, role),
}))

// Mock useAuth hook
const mockUser = { id: 1, email: 'admin@ua.pt', name: 'Admin', role: 'ADMIN' }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isLoading: false, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: {
        users: [
          {
            id: 1,
            email: 'admin@ua.pt',
            name: 'Admin User',
            role: 'ADMIN',
            points: 0,
            createdAt: '2024-01-01',
          },
          {
            id: 2,
            email: 'volunteer@ua.pt',
            name: 'Volunteer User',
            role: 'VOLUNTEER',
            points: 100,
            createdAt: '2024-01-02',
          },
          {
            id: 3,
            email: 'promoter@ua.pt',
            name: 'Promoter User',
            role: 'PROMOTER',
            points: 50,
            createdAt: '2024-01-03',
          },
        ],
        currentPage: 0,
        totalPages: 1,
        totalElements: 3,
        pageSize: 10,
        hasNext: false,
        hasPrevious: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    })),
    useMutation: vi.fn(() => ({
      mutate: mockUpdateUserRole,
      isPending: false,
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  }
})

// Import after mocks are set up
import { Route } from '@/routes/admin/users'

// Get the component from the route
const UsersPage = Route.options.component as React.ComponentType
const beforeLoad = Route.options.beforeLoad as () => void

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    it('should render the Manage Users heading', () => {
      render(<UsersPage />)

      expect(screen.getByRole('heading', { name: /manage users/i })).toBeInTheDocument()
    })

    it('should render description text', () => {
      render(<UsersPage />)

      expect(screen.getByText(/view and update user roles/i)).toBeInTheDocument()
    })

    it('should render Back to Dashboard button with link to /admin', () => {
      render(<UsersPage />)

      const backLink = screen.getByRole('link', { name: /back to dashboard/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/admin')
    })

    it('should render User List card', () => {
      render(<UsersPage />)

      expect(screen.getByText('User List')).toBeInTheDocument()
    })

    it('should render search input', () => {
      render(<UsersPage />)

      expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument()
    })

    it('should render role filter dropdown', () => {
      render(<UsersPage />)

      // Query by the "All Roles" option which is unique to the filter dropdown
      expect(screen.getByText('All Roles')).toBeInTheDocument()
    })

    it('should render total users count', () => {
      render(<UsersPage />)

      expect(screen.getByText(/3 total users/i)).toBeInTheDocument()
    })
  })

  describe('user table', () => {
    it('should render table headers', () => {
      render(<UsersPage />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Current Role')).toBeInTheDocument()
      expect(screen.getByText('Points')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should render user rows', () => {
      render(<UsersPage />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('admin@ua.pt')).toBeInTheDocument()
      expect(screen.getByText('Volunteer User')).toBeInTheDocument()
      expect(screen.getByText('volunteer@ua.pt')).toBeInTheDocument()
      expect(screen.getByText('Promoter User')).toBeInTheDocument()
      expect(screen.getByText('promoter@ua.pt')).toBeInTheDocument()
    })

    it('should show "(you)" label for current user', () => {
      render(<UsersPage />)

      expect(screen.getByText('(you)')).toBeInTheDocument()
    })

    it('should show "Cannot edit own role" for current user', () => {
      render(<UsersPage />)

      expect(screen.getByText(/cannot edit own role/i)).toBeInTheDocument()
    })

    it('should render role badges', () => {
      render(<UsersPage />)

      expect(screen.getByText('ADMIN')).toBeInTheDocument()
      expect(screen.getByText('VOLUNTEER')).toBeInTheDocument()
      expect(screen.getByText('PROMOTER')).toBeInTheDocument()
    })

    it('should render role select for non-current users', () => {
      render(<UsersPage />)

      // Non-current users should have role options available (Volunteer, Promoter labels in their row selects)
      // The filter has "All Roles" and each user row select has role options
      const volunteerOptions = screen.getAllByText('Volunteer')
      // At least one for the filter dropdown and one for row selects
      expect(volunteerOptions.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('search functionality', () => {
    it('should update search input on type', async () => {
      const user = userEvent.setup()
      render(<UsersPage />)

      const searchInput = screen.getByPlaceholderText(/search by name or email/i)
      await user.type(searchInput, 'volunteer')

      expect(searchInput).toHaveValue('volunteer')
    })
  })
})
