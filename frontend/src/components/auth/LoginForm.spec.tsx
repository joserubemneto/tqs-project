import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { LoginForm } from './LoginForm'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
  setAuthToken: vi.fn(),
  parseAuthError: vi.fn(),
  getAuthToken: vi.fn(() => null),
  clearAuthToken: vi.fn(),
}))

import { login, parseAuthError, setAuthToken } from '@/lib/auth'

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Rendering', () => {
    it('should render the form with all required fields', () => {
      render(<LoginForm />)

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render sign up link', () => {
      render(<LoginForm />)

      const signUpLink = screen.getByRole('link', { name: /create one/i })
      expect(signUpLink).toBeInTheDocument()
      expect(signUpLink).toHaveAttribute('href', '/register')
    })

    it('should render description text', () => {
      render(<LoginForm />)

      expect(
        screen.getByText(/sign in to access the ua volunteering platform/i),
      ).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })

    it('should show error when password is empty', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    it('should show multiple validation errors at once', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    it('should clear errors on resubmit', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      // First submit with errors
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()

      // Fill in email and submit again
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Email error should be cleared
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call login with correct data on valid submission', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockResolvedValue({
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token',
      })

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({
          email: 'test@ua.pt',
          password: 'password123',
        })
      })
    })

    it('should call setAuthToken with the response token', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockResolvedValue({
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token-123',
      })

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(setAuthToken).toHaveBeenCalledWith('mock-token-123')
      })
    })

    it('should call onSuccess callback after successful login', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockResolvedValue({
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token',
      })

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should call onSuccess with full response including role', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        id: 1,
        email: 'admin@ua.pt',
        name: 'Admin User',
        role: 'ADMIN' as const,
        token: 'mock-token',
      }
      vi.mocked(login).mockResolvedValue(mockResponse)

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse)
      })
    })

    it('should not call login if validation fails', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(login).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: 1,
                  email: 'test@ua.pt',
                  name: 'Test User',
                  role: 'VOLUNTEER',
                  token: 'mock-token',
                }),
              100,
            ),
          ),
      )

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
    })

    it('should disable form fields during loading', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: 1,
                  email: 'test@ua.pt',
                  name: 'Test User',
                  role: 'VOLUNTEER',
                  token: 'mock-token',
                }),
              100,
            ),
          ),
      )

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByLabelText(/email/i)).toBeDisabled()
      expect(screen.getByLabelText(/password/i)).toBeDisabled()
    })

    it('should disable submit button during loading', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: 1,
                  email: 'test@ua.pt',
                  name: 'Test User',
                  role: 'VOLUNTEER',
                  token: 'mock-token',
                }),
              100,
            ),
          ),
      )

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display API error message on login failure', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseAuthError).mockResolvedValue('Invalid credentials')

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
      })
    })

    it('should call parseAuthError when login fails', async () => {
      const user = userEvent.setup()
      const error = new Error('API Error')
      vi.mocked(login).mockRejectedValue(error)
      vi.mocked(parseAuthError).mockResolvedValue('An error occurred')

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(parseAuthError).toHaveBeenCalledWith(error)
      })
    })

    it('should not call onSuccess when login fails', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseAuthError).mockResolvedValue('An error occurred')

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should re-enable form after error', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseAuthError).mockResolvedValue('An error occurred')

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/email/i)).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
    })
  })

  describe('Input Handling', () => {
    it('should update email field value', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'john@ua.pt')

      expect(emailInput).toHaveValue('john@ua.pt')
    })

    it('should update password field value', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, 'securepass')

      expect(passwordInput).toHaveValue('securepass')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible labels for all inputs', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('should have correct input types', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    })

    it('should have autocomplete attributes', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password')
    })

    it('should display error alert with role="alert"', async () => {
      const user = userEvent.setup()
      vi.mocked(login).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseAuthError).mockResolvedValue('An error occurred')

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})
