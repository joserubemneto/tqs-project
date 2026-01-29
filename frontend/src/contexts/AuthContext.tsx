import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { clearAuthToken, getAuthToken, type UserRole } from '@/lib/auth'
import { getProfile } from '@/lib/profile'

interface User {
  id: number
  email: string
  name: string
  role: UserRole
  points?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void
  refreshPoints: () => Promise<void>
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

  const refreshPoints = useCallback(async () => {
    if (!user) return
    try {
      const profile = await getProfile()
      setUser((prev) => (prev ? { ...prev, points: profile.points } : null))
    } catch {
      // Silently fail - points will update on next page load
    }
  }, [user])

  useEffect(() => {
    // Restore user from token on mount and fetch points
    const initAuth = async () => {
      const token = getAuthToken()
      if (token) {
        const decoded = decodeToken(token)
        if (decoded) {
          setUser(decoded)
          // Fetch current points from profile
          try {
            const profile = await getProfile()
            setUser((prev) => (prev ? { ...prev, points: profile.points } : null))
          } catch {
            // Continue without points if profile fetch fails
          }
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const logout = () => {
    clearAuthToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout, refreshPoints }}>
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
