"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface UserWithRole {
  id: number
  name: string
  email: string
  role_name: string
}

interface UsersByRoleProps {
  roleId: string | undefined
}

export function UsersByRole({ roleId }: UsersByRoleProps) {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = async () => {
    if (!roleId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch users with the selected role from Supabase
      const response = await fetch(`/api/roles/${roleId}/users`)

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data || [])
    } catch (err: any) {
      console.error("Error loading users:", err)
      setError(`Failed to load users: ${err.message}`)
      toast({
        title: "Error",
        description: "Failed to load users for this role",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (roleId) {
      loadUsers()
    } else {
      setUsers([])
    }
  }, [roleId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users in this Role</CardTitle>
        <CardDescription>A list of all users currently assigned to this role.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading users...
          </div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No users found with this role.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
