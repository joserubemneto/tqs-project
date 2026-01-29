import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { RegisterForm } from './RegisterForm'

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
  register: vi.fn(),
  setAuthToken: vi.fn(),
  parseAuthError: vi.fn(),
  getAuthToken: vi.fn(() => null),
  clearAuthToken: vi.fn(),
}))

import { parseAuthError, register, setAuthToken } from '@/lib/auth'

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Rendering', () => {
    it('should render the form with all required fields', () => {
      render(<RegisterForm />)

      expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /i want to join as/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should render role select with default VOLUNTEER option', () => {
      render(<RegisterForm />)

      const roleSelect = screen.getByRole('combobox', { name: /i want to join as/i })
      expect(roleSelect).toHaveValue('VOLUNTEER')
    })

    it('should render role options correctly', () => {
      render(<RegisterForm />)

      expect(screen.getByRole('option', { name: /volunteer/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /promoter/i })).toBeInTheDocument()
    })

    it('should render sign in link', () => {
      render(<RegisterForm />)

      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toBeInTheDocument()
      expect(signInLink).toHaveAttribute('href', '/login')
    })

    it('should render description text', () => {
      render(<RegisterForm />)

      expect(
        screen.getByText(/join the ua volunteering platform and start making a difference/i),
      ).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when name is empty', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })

    it('should show error when name is too short', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'A')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })

    it('should show error when email is empty', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })

    it('should show error when password is empty', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    it('should show error when password is too short', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'short')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })

    it('should show multiple validation errors at once', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    it('should clear errors on resubmit', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      // First submit with errors
      await user.click(screen.getByRole('button', { name: /create account/i }))
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()

      // Fill in name and submit again
      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Name error should be cleared
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call register with correct data on valid submission', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockResolvedValue({
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token',
      })

      render(<RegisterForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(register).toHaveBeenCalledWith({
          email: 'test@ua.pt',
          password: 'password123',
          name: 'Test User',
          role: 'VOLUNTEER',
        })
      })
    })

    it('should call setAuthToken with the response token', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockResolvedValue({
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token-123',
      })

      render(<RegisterForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(setAuthToken).toHaveBeenCalledWith('mock-token-123')
      })
    })

    it('should call onSuccess callback after successful registration', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockResolvedValue({
        id: 1,
        email: 'test@ua.pt',
        name: 'Test User',
        role: 'VOLUNTEER',
        token: 'mock-token',
      })

      render(<RegisterForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

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
      vi.mocked(register).mockResolvedValue(mockResponse)

      render(<RegisterForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/name/i), 'Admin User')
      await user.type(screen.getByLabelText(/email/i), 'admin@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse)
      })
    })

    it('should submit with PROMOTER role when selected', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockResolvedValue({
        id: 1,
        email: 'promoter@ua.pt',
        name: 'Promoter User',
        role: 'PROMOTER',
        token: 'mock-token',
      })

      render(<RegisterForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/name/i), 'Promoter User')
      await user.type(screen.getByLabelText(/email/i), 'promoter@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.selectOptions(
        screen.getByRole('combobox', { name: /i want to join as/i }),
        'PROMOTER',
      )
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(register).toHaveBeenCalledWith({
          email: 'promoter@ua.pt',
          password: 'password123',
          name: 'Promoter User',
          role: 'PROMOTER',
        })
      })
    })

    it('should not call register if validation fails', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(register).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockImplementation(
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

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument()
    })

    it('should disable form fields during loading', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockImplementation(
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

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByLabelText(/name/i)).toBeDisabled()
      expect(screen.getByLabelText(/email/i)).toBeDisabled()
      expect(screen.getByLabelText(/password/i)).toBeDisabled()
      expect(screen.getByRole('combobox', { name: /i want to join as/i })).toBeDisabled()
    })

    it('should disable submit button during loading', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockImplementation(
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

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display API error message on registration failure', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseAuthError).mockResolvedValue('Email already registered')

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'existing@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Email already registered')
      })
    })

    it('should call parseAuthError when registration fails', async () => {
      const user = userEvent.setup()
      const error = new Error('API Error')
      vi.mocked(register).mockRejectedValue(error)
      vi.mocked(parseAuthError).mockResolvedValue('An error occurred')

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(parseAuthError).toHaveBeenCalledWith(error)
      })
    })

    it('should not call onSuccess when registration fails', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseAuthError).mockResolvedValue('An error occurred')

      render(<RegisterForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should re-enable form after error', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseAuthError).mockResolvedValue('An error occurred')

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/name/i)).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled()
    })
  })

  describe('Input Handling', () => {
    it('should update name field value', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/name/i)
      await user.type(nameInput, 'John Doe')

      expect(nameInput).toHaveValue('John Doe')
    })

    it('should update email field value', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'john@ua.pt')

      expect(emailInput).toHaveValue('john@ua.pt')
    })

    it('should update password field value', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, 'securepass')

      expect(passwordInput).toHaveValue('securepass')
    })

    it('should update role selection', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const roleSelect = screen.getByRole('combobox', { name: /i want to join as/i })
      await user.selectOptions(roleSelect, 'PROMOTER')

      expect(roleSelect).toHaveValue('PROMOTER')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible labels for all inputs', () => {
      render(<RegisterForm />)

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/i want to join as/i)).toBeInTheDocument()
    })

    it('should have correct input types', () => {
      render(<RegisterForm />)

      expect(screen.getByLabelText(/name/i)).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    })

    it('should have autocomplete attributes', () => {
      render(<RegisterForm />)

      expect(screen.getByLabelText(/name/i)).toHaveAttribute('autocomplete', 'name')
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'new-password')
    })

    it('should display error alert with role="alert"', async () => {
      const user = userEvent.setup()
      vi.mocked(register).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseAuthError).mockResolvedValue('An error occurred')

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@ua.pt')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})
