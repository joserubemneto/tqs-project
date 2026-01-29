import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getAuthToken } from '@/lib/auth'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: () => {
    const token = getAuthToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: UsersPage,
})

function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
          <p className="text-muted mt-2">View and update user roles</p>
        </div>
        <Link to="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-center py-8">
            User management table will be implemented here.
            <br />
            This requires the backend API endpoints to be created first.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
