import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui'
import { getAuthToken, isAdmin, getUsers, updateUserRole, type UserRole, type UserResponse } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronLeft, ChevronRight, Search, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/admin/users')({
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
  component: UsersPage,
})

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'PROMOTER', label: 'Promoter' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'ADMIN', label: 'Admin' },
]

const ROLE_BADGE_VARIANTS: Record<UserRole, 'default' | 'secondary' | 'outline' | 'error' | 'success' | 'warning'> = {
  VOLUNTEER: 'default',
  PROMOTER: 'secondary',
  PARTNER: 'outline',
  ADMIN: 'error',
}

const PAGE_SIZE = 10

function UsersPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  // State
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filter changes
  useEffect(() => {
    setPage(0)
  }, [roleFilter])

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Fetch users query
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'users', page, debouncedSearch, roleFilter],
    queryFn: () =>
      getUsers({
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      }),
  })

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) => updateUserRole(userId, role),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setNotification({
        type: 'success',
        message: `Successfully updated ${updatedUser.name}'s role to ${updatedUser.role}`,
      })
      setEditingUserId(null)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to update role'
      // Parse the error message if it's JSON
      try {
        const parsed = JSON.parse(message)
        setNotification({ type: 'error', message: parsed.message || message })
      } catch {
        setNotification({ type: 'error', message })
      }
      setEditingUserId(null)
    },
  })

  const handleRoleChange = useCallback(
    (userId: number, newRole: UserRole) => {
      setEditingUserId(userId)
      updateRoleMutation.mutate({ userId, role: newRole })
    },
    [updateRoleMutation],
  )

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setRoleFilter('')
    setPage(0)
  }

  const hasFilters = search || roleFilter

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
          <p className="text-muted-foreground mt-2">View and update user roles</p>
        </div>
        <Link to="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-md flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-auto hover:opacity-70"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>User List</span>
            {usersData && (
              <span className="text-sm font-normal text-muted-foreground">
                {usersData.totalElements} total users
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={ROLE_OPTIONS}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              />
            </div>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive font-medium">Failed to load users</p>
              <p className="text-muted-foreground text-sm mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          )}

          {/* Users Table */}
          {usersData && !isLoading && !isError && (
            <>
              {usersData.users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {hasFilters ? 'No users match your search criteria' : 'No users found'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.users.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        currentUserId={currentUser?.id}
                        isUpdating={editingUserId === user.id && updateRoleMutation.isPending}
                        onRoleChange={handleRoleChange}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {usersData.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {usersData.currentPage + 1} of {usersData.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={!usersData.hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!usersData.hasNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface UserRowProps {
  user: UserResponse
  currentUserId?: number
  isUpdating: boolean
  onRoleChange: (userId: number, role: UserRole) => void
}

function UserRow({ user, currentUserId, isUpdating, onRoleChange }: UserRowProps) {
  const isCurrentUser = user.id === currentUserId
  const roleOptions = [
    { value: 'VOLUNTEER', label: 'Volunteer' },
    { value: 'PROMOTER', label: 'Promoter' },
    { value: 'PARTNER', label: 'Partner' },
    { value: 'ADMIN', label: 'Admin' },
  ]

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.name}
        {isCurrentUser && (
          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
        )}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant={ROLE_BADGE_VARIANTS[user.role]}>{user.role}</Badge>
      </TableCell>
      <TableCell>{user.points}</TableCell>
      <TableCell>
        {isCurrentUser ? (
          <span className="text-sm text-muted-foreground">Cannot edit own role</span>
        ) : (
          <div className="flex items-center gap-2">
            <Select
              options={roleOptions}
              value={user.role}
              onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
              disabled={isUpdating}
              className="w-32"
            />
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}
