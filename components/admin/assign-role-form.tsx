"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase-singleton"

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
  const supabase = createClient()

  // Load employees and roles
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        // Load employees with their current roles
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select(`
            id, 
            first_name, 
            last_name,
            user_accounts!employee_id (
              role_id,
              roles!role_id (
                id,
                title
              )
            )
          `)
          .order("first_name, last_name")

        if (employeesError) throw new Error(`Failed to fetch employees: ${employeesError.message}`)

        const transformedEmployees = employeesData.map((employee) => {
          // Extract role information if available
          const userAccount = employee.user_accounts?.[0]
          const role = userAccount?.roles || null

          return {
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            current_role: role,
          }
        })

        setEmployees(transformedEmployees || [])

        // Load roles with descriptions
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("id, title, description")
          .order("title")

        if (rolesError) throw new Error(`Failed to fetch roles: ${rolesError.message}`)
        setRoles(rolesData || [])
      } catch (error: any) {
        console.error("Error loading data:", error)
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

      // Check if user account exists for this employee
      const { data: existingUser, error: userCheckError } = await supabase
        .from("user_accounts")
        .select("id, role_id")
        .eq("employee_id", employeeId)
        .maybeSingle()

      if (userCheckError) throw new Error(`Error checking user account: ${userCheckError.message}`)

      let result

      if (existingUser) {
        // Store old role for audit
        const oldRoleId = existingUser.role_id

        // Update existing user account
        result = await supabase
          .from("user_accounts")
          .update({
            role_id: roleId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id)
          .select()

        // Log to audit trail
        await supabase
          .from("audit_security.audit_trail")
          .insert({
            entity_type: "user_role",
            entity_id: existingUser.id.toString(),
            action: "update",
            old_values: { role_id: oldRoleId },
            new_values: { role_id: roleId },
            user_id: "00000000-0000-0000-0000-000000000000", // System user
            timestamp: new Date().toISOString(),
          })
          .select()
      } else {
        // Create new user account with default values
        const employee = employees.find((e) => e.id === employeeId)
        if (!employee) throw new Error("Employee not found")

        const nameParts = employee.name.split(" ")
        const firstName = nameParts[0].toLowerCase()
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : ""

        const username = `${firstName}.${lastName}${Math.floor(Math.random() * 1000)}`
        const email = `${username}@example.com`
        const defaultPassword = "$2b$10$defaulthashedpasswordxxxxxxxxxxxxxxxxxxx" // Placeholder

        result = await supabase
          .from("user_accounts")
          .insert({
            employee_id: employeeId,
            role_id: roleId,
            username,
            email,
            password_hash: defaultPassword,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        // Log to audit trail
        if (result.data && result.data[0]) {
          await supabase
            .from("audit_security.audit_trail")
            .insert({
              entity_type: "user_role",
              entity_id: result.data[0].id.toString(),
              action: "create",
              old_values: null,
              new_values: { role_id: roleId, employee_id: employeeId },
              user_id: "00000000-0000-0000-0000-000000000000", // System user
              timestamp: new Date().toISOString(),
            })
            .select()
        }
      }

      if (result.error) throw new Error(`Failed to update user role: ${result.error.message}`)

      // Get role name for success message
      const role = roles.find((r) => r.id === roleId)
      const employee = employees.find((e) => e.id === employeeId)

      setSuccess(`Successfully assigned ${role?.title} role to ${employee?.name}`)

      // Reset form
      setSelectedEmployee("")
      setSelectedRole("")
    } catch (error: any) {
      console.error("Error assigning role:", error)
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
          <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
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
