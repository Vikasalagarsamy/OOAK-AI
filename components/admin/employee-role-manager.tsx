"use client"

import { useState, useEffect } from "react"
import { query, transaction } from "@/lib/postgresql-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, RefreshCw, Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { UserCheck, Users } from "lucide-react"

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  employee_id: string
  current_role?: {
    id: number
    title: string
  } | null
  has_account: boolean
}

interface Role {
  id: number
  title: string
  description?: string
}

export function EmployeeRoleManager() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load employees and roles
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        setError(null)
        console.log('🔍 Loading employees and roles...')

        // Load employees with their current roles and account status
        const employeesResult = await query(`
          SELECT 
            e.id,
            e.first_name,
            e.last_name,
            e.email,
            e.employee_id,
            ua.id as account_id,
            ua.role_id,
            r.id as role_id,
            r.title as role_title,
            CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as has_account
          FROM employees e
          LEFT JOIN user_accounts ua ON e.id = ua.employee_id
          LEFT JOIN roles r ON ua.role_id = r.id
          ORDER BY e.first_name, e.last_name
        `)

        if (!employeesResult.success) {
          throw new Error(employeesResult.error || 'Failed to fetch employees')
        }

        const transformedEmployees = (employeesResult.data || []).map((emp) => ({
          id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
          employee_id: emp.employee_id,
          has_account: emp.has_account,
          current_role: emp.role_id ? {
            id: emp.role_id,
            title: emp.role_title
          } : null,
        }))

        setEmployees(transformedEmployees)
        console.log(`✅ Loaded ${transformedEmployees.length} employees`)

        // Load roles
        const rolesResult = await query(`
          SELECT id, title, description 
          FROM roles 
          ORDER BY title
        `)

        if (!rolesResult.success) {
          throw new Error(rolesResult.error || 'Failed to fetch roles')
        }

        setRoles(rolesResult.data || [])
        console.log(`✅ Loaded ${rolesResult.data?.length || 0} roles`)

      } catch (error: any) {
        console.error("❌ Error loading data:", error)
        setError(`Failed to load data: ${error.message}`)
        toast({
          title: "Error",
          description: `Failed to load data: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle role assignment
  const handleAssignRole = async () => {
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
      const role = roles.find((r) => r.id === roleId)

      if (!employee || !role) {
        throw new Error("Selected employee or role not found")
      }

      console.log(`🔄 Assigning ${role.title} role to ${employee.first_name} ${employee.last_name}`)

      // Use transaction for atomic role assignment
      const result = await transaction(async (queryFn) => {
        // Check if employee already has an account
        const existingAccountResult = await queryFn(`
          SELECT id, role_id 
          FROM user_accounts 
          WHERE employee_id = $1
        `, [employeeId])

        const existingAccount = existingAccountResult.data?.[0]

        if (existingAccount) {
          // Update existing account role
          await queryFn(`
            UPDATE user_accounts 
            SET role_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [roleId, existingAccount.id])

          return { action: 'updated', accountId: existingAccount.id }
        } else {
          // Create new user account
          const defaultUsername = `${employee.first_name.toLowerCase()}.${employee.last_name.toLowerCase()}`
          const defaultPassword = "$2b$10$defaulthashedpasswordxxxxxxxxxxxxxxxxxxx"

          const newAccountResult = await queryFn(`
            INSERT INTO user_accounts (
              employee_id, role_id, username, email, password_hash,
              is_active, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id
          `, [employeeId, roleId, defaultUsername, employee.email, defaultPassword])

          const newAccountId = newAccountResult.data?.[0]?.id
          return { action: 'created', accountId: newAccountId }
        }
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign role')
      }

      const actionText = result.data?.action === 'created' ? 'created account and assigned' : 'updated'
      toast({
        title: "Success",
        description: `Successfully ${actionText} ${role.title} role for ${employee.first_name} ${employee.last_name}`,
      })

      console.log(`✅ Role assignment completed: ${actionText} ${role.title} for ${employee.first_name} ${employee.last_name}`)

      // Refresh employee data
      await refreshEmployeeData()

      // Reset form
      setSelectedEmployee("")
      setSelectedRole("")

    } catch (error: any) {
      console.error("❌ Error assigning role:", error)
      setError(`Failed to assign role: ${error.message}`)
      toast({
        title: "Error",
        description: `Failed to assign role: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Refresh employee data
  const refreshEmployeeData = async () => {
    try {
      console.log('🔄 Refreshing employee data...')
      
      const employeesResult = await query(`
        SELECT 
          e.id,
          e.first_name,
          e.last_name,
          e.email,
          e.employee_id,
          ua.id as account_id,
          ua.role_id,
          r.id as role_id,
          r.title as role_title,
          CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as has_account
        FROM employees e
        LEFT JOIN user_accounts ua ON e.id = ua.employee_id
        LEFT JOIN roles r ON ua.role_id = r.id
        ORDER BY e.first_name, e.last_name
      `)

      if (employeesResult.success) {
        const transformedEmployees = (employeesResult.data || []).map((emp) => ({
          id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
          employee_id: emp.employee_id,
          has_account: emp.has_account,
          current_role: emp.role_id ? {
            id: emp.role_id,
            title: emp.role_title
          } : null,
        }))

        setEmployees(transformedEmployees)
        console.log('✅ Employee data refreshed')
      }
    } catch (error: any) {
      console.error("❌ Error refreshing employee data:", error)
    }
  }

  // Get selected employee data
  const selectedEmployeeData = selectedEmployee
    ? employees.find((e) => e.id === Number.parseInt(selectedEmployee))
    : null

  // Get employees with and without accounts
  const employeesWithAccounts = employees.filter((e) => e.has_account)
  const employeesWithoutAccounts = employees.filter((e) => !e.has_account)

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Employee Role Management
          </CardTitle>
          <CardDescription>
            Assign roles to employees and manage their account access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employee</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {employee.first_name} {employee.last_name}
                            </span>
                            <div className="flex items-center gap-2 ml-2">
                              {employee.has_account ? (
                                <Badge variant="default" className="text-xs">
                                  {employee.current_role?.title || "No Role"}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  No Account
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEmployeeData && (
                    <div className="text-sm text-muted-foreground">
                      Employee ID: {selectedEmployeeData.employee_id} | Email: {selectedEmployeeData.email}
                      {selectedEmployeeData.current_role && (
                        <span className="ml-2">
                          | Current Role: <Badge variant="outline">{selectedEmployeeData.current_role.title}</Badge>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
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
                  {selectedRole && (
                    <p className="text-sm text-muted-foreground">
                      {roles.find((r) => r.id === Number.parseInt(selectedRole))?.description}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleAssignRole}
                  disabled={!selectedEmployee || !selectedRole || saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Assign Role
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-600" />
                Employees with Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-2">
                {employeesWithAccounts.length}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {employeesWithAccounts.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                    <span className="text-sm font-medium">
                      {employee.first_name} {employee.last_name}
                    </span>
                    <Badge variant="default" className="text-xs">
                      {employee.current_role?.title || "No Role"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-orange-600" />
                Employees without Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {employeesWithoutAccounts.length}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {employeesWithoutAccounts.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-md">
                    <span className="text-sm font-medium">
                      {employee.first_name} {employee.last_name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      No Account
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 