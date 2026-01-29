import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate({ to: '/' })
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="font-semibold text-lg hover:text-primary transition-colors">
              UA Volunteering
            </Link>

            <div className="flex items-center gap-4">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : user ? (
                <>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm">
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  {(user.role === 'PROMOTER' || user.role === 'ADMIN') && (
                    <Link to="/opportunities/create">
                      <Button variant="secondary" size="sm">
                        Create Opportunity
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile">
                    <Button variant="ghost" size="sm">
                      My Profile
                    </Button>
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-right hidden sm:block">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-muted text-xs">{user.role}</p>
                    </div>
                    <Link to="/profile">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity">
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="py-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 hover:text-primary transition-colors">
              UA Volunteering Platform
            </h1>
          </Link>
          <p className="text-xl text-muted max-w-2xl mx-auto px-4">
            Connect with volunteering opportunities at Universidade de Aveiro. Earn points, make an
            impact, and build community.
          </p>
        </header>
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  )
}
