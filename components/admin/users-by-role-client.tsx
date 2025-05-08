"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, User } from "lucide-react"

interface UserWithRole {
  id: number
  username: string
  email: string
  name: string
  role_name: string
}

export function UsersByRole({ roleId: initialRoleId }: { roleId?: string }) {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      if (!initialRoleId) {
        setUsers([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/roles/${initialRoleId}/users`)

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`)
        }

        const data = await response.json()
        setUsers(data || [])
      } catch (err: any) {
        console.error("Error loading users:", err)
        setError(`Error loading users: ${err.message}`)
        toast({
          title: "Error",
          description: "Failed to load users for this role",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [initialRoleId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users in this Role</CardTitle>
        <CardDescription>A list of all users currently assigned to this role.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : users.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <div className="flex flex-col items-center justify-center gap-2">
              <User className="h-8 w-8 text-gray-300" />
              <p>No users found with this role</p>
            </div>
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
