import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className="min-h-screen bg-background">
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
