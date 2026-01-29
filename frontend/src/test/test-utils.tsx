import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderOptions, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'

// Create a new QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: ReactNode
}

// Wrapper with QueryClient and AuthProvider (for component tests)
function TestWrapper({ children }: WrapperProps) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

// Custom render with QueryClient and AuthProvider
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: TestWrapper, ...options })
}

export * from '@testing-library/react'
export { customRender as render, createTestQueryClient }
