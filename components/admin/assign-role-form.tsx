"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"


interface Employee {
  id: number
  name: string
  current_role?: {
    id: number
    title: string
  } | null
}

interface Role {
  id: number
  title: string
  description: string
}

export function AssignRoleForm() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load employees and roles
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        console.log('🔍 Loading employees and roles...')

        // Load employees with their current roles in one optimized query
        const employeesResult = await query(`
          SELECT 
            e.id, 
            e.first_name, 
            e.last_name,
            ua.role_id,
            r.id as role_id,
            r.title as role_title
          FROM employees e
          LEFT JOIN user_accounts ua ON e.id = ua.employee_id
          LEFT JOIN roles r ON ua.role_id = r.id
          ORDER BY e.first_name, e.last_name
        `)

        if (!employeesResult.success) {
          throw new Error(`Failed to fetch employees: ${employeesResult.error}`)
        }

        const transformedEmployees = (employeesResult.data || []).map((employee) => ({
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
          current_role: employee.role_id ? {
            id: employee.role_id,
            title: employee.role_title
          } : null,
        }))

        setEmployees(transformedEmployees)
        console.log(`✅ Loaded ${transformedEmployees.length} employees`)

        // Load roles with descriptions
        const rolesResult = await query(`
          SELECT id, title, description 
          FROM roles 
          ORDER BY title
        `)

        if (!rolesResult.success) {
          throw new Error(`Failed to fetch roles: ${rolesResult.error}`)
        }

        setRoles(rolesResult.data || [])
        console.log(`✅ Loaded ${rolesResult.data?.length || 0} roles`)

      } catch (error: any) {
        console.error("❌ Error loading data:", error)
        setError(`Failed to load data: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [success]) // Reload data when a successful assignment happens

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedRole) {
      setError("Please select both an employee and a role")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const employeeId = Number.parseInt(selectedEmployee, 10)
      const roleId = Number.parseInt(selectedRole, 10)

      console.log(`🔄 Assigning role ${roleId} to employee ${employeeId}`)

      // Use transaction for atomic role assignment
      const result = await transaction(async (queryFn) => {
        // Check if user account exists for this employee
        const existingUserResult = await queryFn(`
          SELECT id, role_id 
          FROM user_accounts 
          WHERE employee_id = $1
        `, [employeeId])

        const existingUser = existingUserResult.data?.[0]

        if (existingUser) {
          // Store old role for audit
          const oldRoleId = existingUser.role_id

          // Update existing user account
          await queryFn(`
            UPDATE user_accounts 
            SET role_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [roleId, existingUser.id])

          // Log to audit trail
          await queryFn(`
            INSERT INTO audit_security.audit_trail (
              entity_type, entity_id, action, old_values, new_values, 
              user_id, timestamp
            ) VALUES (
              'user_role', $1, 'update', $2, $3, $4, CURRENT_TIMESTAMP
            )
          `, [
            existingUser.id.toString(),
            JSON.stringify({ role_id: oldRoleId }),
            JSON.stringify({ role_id: roleId }),
            '00000000-0000-0000-0000-000000000000' // System user
          ])

          return { action: 'updated', userId: existingUser.id }
        } else {
          // Create new user account with default values
          const employee = employees.find((e) => e.id === employeeId)
          if (!employee) throw new Error("Employee not found")

          const nameParts = employee.name.split(" ")
          const firstName = nameParts[0].toLowerCase()
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : ""

          const username = `${firstName}.${lastName}${Math.floor(Math.random() * 1000)}`
          const email = `${username}@company.com`
          const defaultPassword = "$2b$10$defaulthashedpasswordxxxxxxxxxxxxxxxxxxx" // Placeholder

          const newUserResult = await queryFn(`
            INSERT INTO user_accounts (
              employee_id, role_id, username, email, password_hash, 
              is_active, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id
          `, [employeeId, roleId, username, email, defaultPassword])

          const newUserId = newUserResult.data?.[0]?.id

          // Log to audit trail
          await queryFn(`
            INSERT INTO audit_security.audit_trail (
              entity_type, entity_id, action, old_values, new_values, 
              user_id, timestamp
            ) VALUES (
              'user_role', $1, 'create', null, $2, $3, CURRENT_TIMESTAMP
            )
          `, [
            newUserId.toString(),
            JSON.stringify({ role_id: roleId, employee_id: employeeId }),
            '00000000-0000-0000-0000-000000000000' // System user
          ])

          return { action: 'created', userId: newUserId }
        }
      })

      if (!result.success) {
        throw new Error(`Failed to assign role: ${result.error}`)
      }

      // Get role and employee names for success message
      const role = roles.find((r) => r.id === roleId)
      const employee = employees.find((e) => e.id === employeeId)

      const actionText = result.data?.action === 'created' ? 'created account and assigned' : 'assigned'
      setSuccess(`Successfully ${actionText} ${role?.title} role to ${employee?.name}`)

      console.log(`✅ Role assignment completed: ${actionText} ${role?.title} to ${employee?.name}`)

      // Reset form
      setSelectedEmployee("")
      setSelectedRole("")
    } catch (error: any) {
      console.error("❌ Error assigning role:", error)
      setError(`Failed to assign role: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get the current role of the selected employee
  const selectedEmployeeData = selectedEmployee
    ? employees.find((e) => e.id === Number.parseInt(selectedEmployee, 10))
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Role</CardTitle>
        <CardDescription>Assign a role to an employee</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Employee</label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee} disabled={loading || isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.name} {employee.current_role ? `(${employee.current_role.title})` : "(No role)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading || isSubmitting}>
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
            <p className="text-sm text-muted-foreground mt-1">
              {roles.find((r) => r.id === Number.parseInt(selectedRole, 10))?.description}
            </p>
          )}
        </div>

        {selectedEmployeeData?.current_role && selectedRole && (
          <div className="text-sm">
            <span className="font-medium">Current role:</span> {selectedEmployeeData.current_role.title}
            {selectedEmployeeData.current_role.id === Number.parseInt(selectedRole, 10) && (
              <p className="text-amber-600 mt-1">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Employee already has this role
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={!selectedEmployee || !selectedRole || loading || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning...
            </>
          ) : (
            "Assign Role"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
