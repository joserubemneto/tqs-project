import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getAuthToken, clearAuthToken, type UserRole } from '@/lib/auth'

interface User {
  id: number
  email: string
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Decode JWT token to extract user information
 * JWT format: header.payload.signature (base64 encoded)
 */
function decodeToken(token: string): User | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const decoded = JSON.parse(atob(payload))

    // Validate required fields exist
    if (!decoded.email || !decoded.role) {
      return null
    }

    return {
      id: decoded.id || decoded.sub || 0,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0], // Fallback to email prefix
      role: decoded.role,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore user from token on mount
    const token = getAuthToken()
    if (token) {
      const decoded = decodeToken(token)
      setUser(decoded)
    }
    setIsLoading(false)
  }, [])

  const logout = () => {
    clearAuthToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
