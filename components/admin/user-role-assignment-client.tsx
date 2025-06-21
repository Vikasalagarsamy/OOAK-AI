"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, UserPlus } from "lucide-react"

interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  email: string
  has_account: boolean
}

interface Role {
  id: number
  title: string
}

export function UserRoleAssignmentForm() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [saving, setSaving] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        setError(null)
        console.log('🔍 Loading employees and roles...')

        // Fetch employees and their account status in one optimized query
        const employeesResult = await query(`
          SELECT 
            e.id, 
            e.employee_id, 
            e.first_name, 
            e.last_name, 
            e.email,
            CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as has_account
          FROM employees e
          LEFT JOIN user_accounts ua ON e.id = ua.employee_id
          ORDER BY e.first_name
        `)

        if (!employeesResult.success) {
          throw new Error(employeesResult.error || 'Failed to fetch employees')
        }

        setEmployees(employeesResult.data || [])
        console.log(`✅ Loaded ${employeesResult.data?.length || 0} employees`)

        // Fetch roles
        const rolesResult = await query(`
          SELECT id, title 
          FROM roles 
          ORDER BY title
        `)

        if (!rolesResult.success) {
          throw new Error(rolesResult.error || 'Failed to fetch roles')
        }

        setRoles(rolesResult.data || [])
        console.log(`✅ Loaded ${rolesResult.data?.length || 0} roles`)

      } catch (err: any) {
        console.error("❌ Error fetching data:", err)
        setError(`Failed to fetch data: ${err.message}`)
        toast({
          title: "Error",
          description: `Failed to fetch data: ${err.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select both an employee and a role",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const employeeId = Number.parseInt(selectedEmployee)
      const roleId = Number.parseInt(selectedRole)
      const employee = employees.find((e) => e.id === employeeId)

      if (!employee) throw new Error("Selected employee not found")

      console.log(`🔄 Processing role assignment for employee ${employee.first_name} ${employee.last_name}`)

      // Use transaction for atomic user account operations
      const result = await transaction(async (queryFn) => {
        // Check if the employee already has an account
        const existingAccountResult = await queryFn(`
          SELECT id, role_id 
          FROM user_accounts 
          WHERE employee_id = $1
        `, [employeeId])

        const existingAccount = existingAccountResult.data?.[0]

        if (existingAccount) {
          // Update existing account
          await queryFn(`
            UPDATE user_accounts 
            SET role_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [roleId, existingAccount.id])

          return { 
            action: 'updated', 
            message: `Role updated for ${employee.first_name} ${employee.last_name}` 
          }
        } else {
          // Create new account
          // Generate secure temporary password
          const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
          
          await queryFn(`
            INSERT INTO user_accounts (
              employee_id, role_id, email, password_hash, 
              is_active, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `, [employeeId, roleId, employee.email, tempPassword]) // In production, hash this password

          return { 
            action: 'created', 
            message: `Account created for ${employee.first_name} ${employee.last_name}` 
          }
        }
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to process role assignment')
      }

      toast({
        title: "Success",
        description: result.data?.message || 'Role assigned successfully',
      })

      console.log(`✅ ${result.data?.action} account for ${employee.first_name} ${employee.last_name}`)

      // Reset form
      setSelectedEmployee("")
      setSelectedRole("")

      // Refresh employee list to update has_account flag
      const refreshResult = await query(`
        SELECT 
          e.id, 
          e.employee_id, 
          e.first_name, 
          e.last_name, 
          e.email,
          CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as has_account
        FROM employees e
        LEFT JOIN user_accounts ua ON e.id = ua.employee_id
        ORDER BY e.first_name
      `)

      if (refreshResult.success) {
        setEmployees(refreshResult.data || [])
      }

    } catch (err: any) {
      console.error("❌ Error assigning role:", err)
      setError(`Failed to assign role: ${err.message}`)
      toast({
        title: "Error",
        description: `Failed to assign role: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign User Role</CardTitle>
        <CardDescription>Assign a role to an existing employee or create a new user account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.first_name} {employee.last_name}
                      {employee.has_account ? " (Has Account)" : " (No Account)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
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
            </div>
            <Button onClick={handleSubmit} disabled={saving} className="mt-4 flex items-center gap-2">
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Assign Role
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
