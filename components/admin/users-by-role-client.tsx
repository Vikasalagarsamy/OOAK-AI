"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase-browser"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, User } from "lucide-react"

interface Role {
  id: number
  title: string
}

interface UserWithEmployee {
  id: string
  email: string
  employee_id: number
  first_name: string
  last_name: string
  role_id: number
  role_name: string
}

interface UsersByRoleProps {
  roleId?: string
}

export function UsersByRole({ roleId: initialRoleId }: UsersByRoleProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<UserWithEmployee[]>([])
  const [selectedRole, setSelectedRole] = useState<string | undefined>(initialRoleId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        setError(null)
        const { data, error } = await supabase.from("roles").select("id, title").order("title")

        if (error) throw error

        setRoles(data || [])
        if (!selectedRole && data && data.length > 0) {
          setSelectedRole(data[0].id.toString())
        }
      } catch (error: any) {
        console.error("Error loading roles:", error)
        setError(`Failed to load roles: ${error.message}`)
        toast({
          title: "Error",
          description: "Failed to load roles",
          variant: "destructive",
        })
      }
    }

    loadRoles()
  }, [])

  // Load users for selected role
  useEffect(() => {
    async function loadUsers() {
      if (!selectedRole) return

      setLoading(true)
      try {
        setError(null)
        // Use a custom RPC function or a complex query to get users with their employee details and role
        const { data, error } = await supabase.rpc("get_users_by_role", {
          p_role_id: Number.parseInt(selectedRole),
        })

        if (error) throw error

        setUsers(data || [])
      } catch (error: any) {
        console.error("Error loading users:", error)
        setError(`Failed to load users: ${error.message}`)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [selectedRole])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users by Role</CardTitle>
        <CardDescription>View all users assigned to a specific role</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Select value={selectedRole} onValueChange={setSelectedRole} disabled={roles.length === 0 || loading}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <User className="h-8 w-8 text-gray-300" />
                          <p>No users found with this role</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role_name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
