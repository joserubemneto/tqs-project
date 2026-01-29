import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { getAuthToken, isAdmin } from '@/lib/auth'
import { ShieldAlert } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    const token = getAuthToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
    // Check if user has admin role
    if (!isAdmin()) {
      throw redirect({ to: '/', search: { error: 'forbidden' } })
    }
  },
  component: AdminDashboard,
  errorComponent: AdminForbidden,
})

function AdminForbidden() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-6" />
      <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
      <p className="text-muted-foreground mb-8">
        You don't have permission to access the admin panel.
        <br />
        Please contact an administrator if you believe this is an error.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Home</Button>
      </Link>
    </div>
  )
}

function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted mt-2">Manage users, roles, and platform settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>View and manage user accounts and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/users">
              <Button variant="primary" className="w-full">
                View Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunities</CardTitle>
            <CardDescription>Review and approve volunteering opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>View platform analytics and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
