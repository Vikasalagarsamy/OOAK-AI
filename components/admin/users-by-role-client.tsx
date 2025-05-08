"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase-singleton"
import { Badge } from "@/components/ui/badge"

interface UserWithRole {
  id: number
  username: string
  email: string
  name: string
  role_name: string
  last_login: string | null
  created_at: string
  updated_at: string
}

interface Role {
  id: number
  title: string
  description: string
  user_count: number
}

export function UsersByRole() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("1") // Default to Administrator role
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // Used to trigger refreshes
  const supabase = createClient()

  // Load roles with user counts
  useEffect(() => {
    async function loadRoles() {
      try {
        // First get all roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("id, title, description")
          .order("title")

        if (rolesError) throw new Error(`Failed to fetch roles: ${rolesError.message}`)

        // Then get user counts for each role
        const roleCounts = await Promise.all(
          rolesData.map(async (role) => {
            const { count, error } = await supabase
              .from("user_accounts")
              .select("*", { count: "exact", head: true })
              .eq("role_id", role.id)

            return {
              ...role,
              user_count: error ? 0 : count || 0,
            }
          }),
        )

        setRoles(roleCounts || [])
      } catch (error: any) {
        console.error("Error loading roles:", error)
        setError(`Failed to load roles: ${error.message}`)
      }
    }

    loadRoles()
  }, [refreshKey])

  // Load users for the selected role
  useEffect(() => {
    async function loadUsers() {
      if (!selectedRole) return

      setLoading(true)
      setError(null)

      try {
        // Get users with their role information
        const { data, error } = await supabase
          .from("user_accounts")
          .select(`
            id,
            username,
            email,
            last_login,
            created_at,
            updated_at,
            employees!employee_id (
              first_name,
              last_name
            ),
            roles!role_id (
              title
            )
          `)
          .eq("role_id", Number.parseInt(selectedRole, 10))
          .eq("is_active", true)
          .order("username")

        if (error) throw new Error(`Failed to fetch users: ${error.message}`)

        // Transform the data to match the expected format
        const transformedUsers = data.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.employees ? `${user.employees.first_name} ${user.employees.last_name}` : "Unknown",
          role_name: user.roles ? user.roles.title : "Unknown",
          last_login: user.last_login,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }))

        setUsers(transformedUsers || [])
      } catch (error: any) {
        console.error("Error loading users:", error)
        setError(`Error loading users: ${error.message}`)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [selectedRole, refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>View all users assigned to a specific role</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.title} <span className="text-muted-foreground">({role.user_count} users)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRole && (
              <p className="text-sm text-muted-foreground mt-1">
                {roles.find((r) => r.id === Number.parseInt(selectedRole, 10))?.description}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length > 0 ? (
                  // User data
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          {formatDate(user.last_login)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.last_login ? "default" : "outline"}>
                          {user.last_login ? "Active" : "Never logged in"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No users found
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <User className="h-8 w-8 text-gray-300" />
                        <p>No users found with this role</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
