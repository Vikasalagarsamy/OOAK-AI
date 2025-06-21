"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { query } from "@/lib/postgresql-client"
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
  const [selectedRole, setSelectedRole] = useState<string>("1")
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function loadRoles() {
      try {
        console.log('🔍 Loading roles with user counts...')
        
        const result = await query(`
          SELECT 
            r.id, 
            r.title, 
            r.description,
            COUNT(ua.id) as user_count
          FROM roles r
          LEFT JOIN user_accounts ua ON r.id = ua.role_id AND ua.is_active = true
          GROUP BY r.id, r.title, r.description
          ORDER BY r.title
        `)

        if (!result.success) {
          throw new Error(`Failed to fetch roles: ${result.error}`)
        }

        setRoles(result.data || [])
        console.log(`✅ Loaded ${result.data?.length || 0} roles`)
      } catch (error: any) {
        console.error("❌ Error loading roles:", error)
        setError(`Failed to load roles: ${error.message}`)
      }
    }

    loadRoles()
  }, [refreshKey])

  useEffect(() => {
    async function loadUsers() {
      if (!selectedRole) return

      setLoading(true)
      setError(null)

      try {
        console.log(`🔍 Loading users for role ${selectedRole}...`)

        const result = await query(`
          SELECT 
            ua.id,
            ua.username,
            ua.email,
            ua.last_login,
            ua.created_at,
            ua.updated_at,
            COALESCE(e.first_name || ' ' || e.last_name, 'Unknown') as name,
            r.title as role_name
          FROM user_accounts ua
          LEFT JOIN employees e ON ua.employee_id = e.id
          LEFT JOIN roles r ON ua.role_id = r.id
          WHERE ua.role_id = $1 AND ua.is_active = true
          ORDER BY ua.username
        `, [Number.parseInt(selectedRole, 10)])

        if (!result.success) {
          throw new Error(`Failed to fetch users: ${result.error}`)
        }

        setUsers(result.data || [])
        console.log(`✅ Loaded ${result.data?.length || 0} users`)
      } catch (error: any) {
        console.error("❌ Error loading users:", error)
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
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found for this role
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(user.last_login)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          {user.role_name}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
