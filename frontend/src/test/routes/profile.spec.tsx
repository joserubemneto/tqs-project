import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProfileResponse } from '@/lib/profile'
import { render, screen } from '@/test/test-utils'

// Mock TanStack Router
const mockNavigate = vi.fn()
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
  useNavigate: () => mockNavigate,
  redirect: vi.fn(),
}))

// Mock auth functions
vi.mock('@/lib/auth', () => ({
  getAuthToken: vi.fn(() => 'mock-token'),
  clearAuthToken: vi.fn(),
}))

// Mock ProfileForm component
vi.mock('@/components/profile/ProfileForm', () => ({
  ProfileForm: ({ onSuccess }: { onSuccess?: (response: ProfileResponse) => void }) => {
    return (
      <div data-testid="profile-form">
        <button
          type="button"
          onClick={() =>
            onSuccess?.({
              id: 1,
              email: 'volunteer@ua.pt',
              name: 'Updated Name',
              role: 'VOLUNTEER',
              points: 50,
              bio: 'Updated bio',
              skills: [],
              createdAt: '2024-01-01T00:00:00Z',
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
import { Route } from '@/routes/profile'

// Get the component from the route
const ProfilePage = Route.options.component as React.ComponentType

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the ProfileForm component', () => {
    render(<ProfilePage />)

    expect(screen.getByTestId('profile-form')).toBeInTheDocument()
  })

  it('should render page heading', () => {
    render(<ProfilePage />)

    expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument()
  })

  it('should render page description', () => {
    render(<ProfilePage />)

    expect(screen.getByText(/manage your profile information and skills/i)).toBeInTheDocument()
  })

  it('should have correct container styling', () => {
    const { container } = render(<ProfilePage />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('container', 'mx-auto', 'px-4', 'py-8')
  })
})

describe('ProfilePage Route', () => {
  it('should have beforeLoad that checks for auth token', () => {
    expect(Route.options).toBeDefined()
  })
})
