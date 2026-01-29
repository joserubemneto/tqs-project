import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the auth module
const mockGetAuthToken = vi.fn()
const mockClearAuthToken = vi.fn()

vi.mock('@/lib/auth', () => ({
  getAuthToken: () => mockGetAuthToken(),
  clearAuthToken: () => mockClearAuthToken(),
}))

// Mock the profile module
const mockGetProfile = vi.fn()

vi.mock('@/lib/profile', () => ({
  getProfile: () => mockGetProfile(),
}))

// Import after mocks
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Helper function to create a valid JWT token
function createJWT(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payloadStr = btoa(JSON.stringify(payload))
  const signature = 'mock-signature'
  return `${header}.${payloadStr}.${signature}`
}

// Test component that uses the auth context
function TestConsumer() {
  const { user, isLoading, setUser, logout, refreshPoints } = useAuth()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="points">{user?.points ?? 'no-points'}</div>
      <button
        type="button"
        onClick={() => setUser({ id: 99, email: 'new@ua.pt', name: 'New User', role: 'VOLUNTEER' })}
        data-testid="set-user"
      >
        Set User
      </button>
      <button type="button" onClick={logout} data-testid="logout">
        Logout
      </button>
      <button type="button" onClick={refreshPoints} data-testid="refresh-points">
        Refresh Points
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthToken.mockReturnValue(null)
    mockGetProfile.mockRejectedValue(new Error('Not authenticated'))
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })

    it('should return context when used inside AuthProvider', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })

  describe('AuthProvider', () => {
    it('should start with isLoading true and then set to false', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      // After mount, isLoading should become false
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should have no user when no token is stored', async () => {
      mockGetAuthToken.mockReturnValue(null)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    it('should restore user from valid token on mount', async () => {
      const validToken = createJWT({
        id: 1,
        email: 'user@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
      })
      mockGetAuthToken.mockReturnValue(validToken)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      const userEl = screen.getByTestId('user')
      expect(userEl).not.toHaveTextContent('no-user')

      const userData = JSON.parse(userEl.textContent!)
      expect(userData.email).toBe('user@ua.pt')
      expect(userData.name).toBe('Test User')
      expect(userData.role).toBe('VOLUNTEER')
    })

    it('should use sub as id fallback when id is not present', async () => {
      const tokenWithSub = createJWT({
        sub: 42,
        email: 'user@ua.pt',
        name: 'Test User',
        role: 'ADMIN',
      })
      mockGetAuthToken.mockReturnValue(tokenWithSub)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      const userData = JSON.parse(screen.getByTestId('user').textContent!)
      expect(userData.id).toBe(42)
    })

    it('should use 0 as id fallback when neither id nor sub is present', async () => {
      const tokenNoId = createJWT({
        email: 'user@ua.pt',
        name: 'Test User',
        role: 'PARTNER',
      })
      mockGetAuthToken.mockReturnValue(tokenNoId)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      const userData = JSON.parse(screen.getByTestId('user').textContent!)
      expect(userData.id).toBe(0)
    })

    it('should use email prefix as name fallback when name is not present', async () => {
      const tokenNoName = createJWT({
        id: 5,
        email: 'volunteer@ua.pt',
        role: 'VOLUNTEER',
      })
      mockGetAuthToken.mockReturnValue(tokenNoName)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      const userData = JSON.parse(screen.getByTestId('user').textContent!)
      expect(userData.name).toBe('volunteer')
    })

    it('should have no user when token is missing payload', async () => {
      mockGetAuthToken.mockReturnValue('header-only')

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    it('should have no user when token payload is invalid base64', async () => {
      mockGetAuthToken.mockReturnValue('header.!!!invalid-base64!!!.signature')

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    it('should have no user when token is missing required email field', async () => {
      const tokenNoEmail = createJWT({
        id: 1,
        name: 'Test User',
        role: 'VOLUNTEER',
      })
      mockGetAuthToken.mockReturnValue(tokenNoEmail)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    it('should have no user when token is missing required role field', async () => {
      const tokenNoRole = createJWT({
        id: 1,
        email: 'user@ua.pt',
        name: 'Test User',
      })
      mockGetAuthToken.mockReturnValue(tokenNoRole)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    it('should allow setting user via setUser', async () => {
      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')

      await user.click(screen.getByTestId('set-user'))

      const userData = JSON.parse(screen.getByTestId('user').textContent!)
      expect(userData.id).toBe(99)
      expect(userData.email).toBe('new@ua.pt')
      expect(userData.name).toBe('New User')
      expect(userData.role).toBe('VOLUNTEER')
    })

    it('should clear user and token on logout', async () => {
      const validToken = createJWT({
        id: 1,
        email: 'user@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
      })
      mockGetAuthToken.mockReturnValue(validToken)

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // User should be set initially
      expect(screen.getByTestId('user')).not.toHaveTextContent('no-user')

      // Click logout
      await user.click(screen.getByTestId('logout'))

      // User should be cleared
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')

      // clearAuthToken should have been called
      expect(mockClearAuthToken).toHaveBeenCalledTimes(1)
    })

    it('should allow setting user to null', async () => {
      const validToken = createJWT({
        id: 1,
        email: 'user@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
      })
      mockGetAuthToken.mockReturnValue(validToken)

      // Component that sets user to null
      function NullSetter() {
        const { user, setUser, isLoading } = useAuth()
        return (
          <div>
            <div data-testid="user-state">{user ? 'has-user' : 'no-user'}</div>
            <div data-testid="loading-state">{isLoading ? 'loading' : 'ready'}</div>
            <button type="button" onClick={() => setUser(null)} data-testid="clear-user">
              Clear
            </button>
          </div>
        )
      }

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <NullSetter />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('ready')
      })

      expect(screen.getByTestId('user-state')).toHaveTextContent('has-user')

      await user.click(screen.getByTestId('clear-user'))

      expect(screen.getByTestId('user-state')).toHaveTextContent('no-user')
    })
  })

  describe('decodeToken edge cases', () => {
    it('should handle token with empty payload', async () => {
      // Create a token with empty object payload
      const emptyPayloadToken = createJWT({})
      mockGetAuthToken.mockReturnValue(emptyPayloadToken)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Should have no user since email and role are required
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    it('should handle malformed JSON in token payload', async () => {
      // Manually create a token with invalid JSON
      const header = btoa(JSON.stringify({ alg: 'HS256' }))
      const invalidPayload = btoa('not-valid-json')
      mockGetAuthToken.mockReturnValue(`${header}.${invalidPayload}.signature`)

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })

  describe('refreshPoints', () => {
    it('should update user points when refreshPoints is called', async () => {
      const validToken = createJWT({
        id: 1,
        email: 'user@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
      })
      mockGetAuthToken.mockReturnValue(validToken)
      mockGetProfile.mockResolvedValue({ points: 150 })

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Click refresh points
      await user.click(screen.getByTestId('refresh-points'))

      await waitFor(() => {
        expect(screen.getByTestId('points')).toHaveTextContent('150')
      })
    })

    it('should not crash when refreshPoints is called with no user', async () => {
      mockGetAuthToken.mockReturnValue(null)

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Click refresh points - should not crash
      await user.click(screen.getByTestId('refresh-points'))

      // User should still be null
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(mockGetProfile).not.toHaveBeenCalled()
    })

    it('should silently fail when profile fetch fails during refreshPoints', async () => {
      const validToken = createJWT({
        id: 1,
        email: 'user@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
      })
      mockGetAuthToken.mockReturnValue(validToken)
      // First call for initial load succeeds
      mockGetProfile.mockResolvedValueOnce({ points: 100 })
      // Second call for refresh fails
      mockGetProfile.mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('points')).toHaveTextContent('100')
      })

      // Click refresh points - should not crash despite error
      await user.click(screen.getByTestId('refresh-points'))

      // Points should remain unchanged
      await waitFor(() => {
        expect(screen.getByTestId('points')).toHaveTextContent('100')
      })
    })

    it('should fetch points on initial load when token is present', async () => {
      const validToken = createJWT({
        id: 1,
        email: 'user@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
      })
      mockGetAuthToken.mockReturnValue(validToken)
      mockGetProfile.mockResolvedValue({ points: 250 })

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      await waitFor(() => {
        expect(screen.getByTestId('points')).toHaveTextContent('250')
      })

      expect(mockGetProfile).toHaveBeenCalled()
    })
  })
})
