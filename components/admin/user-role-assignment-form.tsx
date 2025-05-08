"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-browser"

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
  name: string
}

export function UserRoleAssignmentForm() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select(`
            id, 
            employee_id, 
            first_name, 
            last_name, 
            email,
            user_accounts!left(id)
          `)
          .order("first_name")

        if (employeesError) throw employeesError

        const processedEmployees = employeesData.map((emp) => ({
          id: emp.id,
          employee_id: emp.employee_id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
          has_account: emp.user_accounts && emp.user_accounts.length > 0,
        }))

        setEmployees(processedEmployees || [])

        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase.from("roles").select("id, name").order("name")

        if (rolesError) throw rolesError

        setRoles(rolesData || [])
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(`Failed to fetch data: ${err.message}`)
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

      // Check if employee already has an account
      if (employee.has_account) {
        // Get the user account ID
        const { data: existingAccount, error: fetchError } = await supabase
          .from("user_accounts")
          .select("id")
          .eq("employee_id", employeeId)
          .single()

        if (fetchError) throw fetchError

        // Update the role
        const { error: updateError } = await supabase
          .from("user_accounts")
          .update({ role_id: roleId })
          .eq("id", existingAccount.id)

        if (updateError) throw updateError

        toast({
          title: "Success",
          description: `Updated role for ${employee.first_name} ${employee.last_name}`,
        })
      } else {
        // Create new account
        if (!employee.email) {
          throw new Error("Employee must have an email to create an account")
        }

        // Generate a username from first name and last name
        const username = `${employee.first_name.toLowerCase()}.${employee.last_name.toLowerCase()}`.replace(/\s+/g, "")

        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8)

        // Create the account
        const { error: createError } = await supabase.from("user_accounts").insert({
          username,
          email: employee.email,
          password_hash: tempPassword, // Note: In a real app, this should be properly hashed
          employee_id: employeeId,
          role_id: roleId,
          is_active: true,
        })

        if (createError) throw createError

        toast({
          title: "Success",
          description: `Created account for ${employee.first_name} ${employee.last_name} with username: ${username} and temporary password: ${tempPassword}`,
        })
      }

      // Reset form
      setSelectedEmployee("")
      setSelectedRole("")

      // Refresh employee list
      const { data: refreshedEmployees, error: refreshError } = await supabase
        .from("employees")
        .select(`
          id, 
          employee_id, 
          first_name, 
          last_name, 
          email,
          user_accounts!left(id)
        `)
        .order("first_name")

      if (refreshError) throw refreshError

      const processedEmployees = refreshedEmployees.map((emp) => ({
        id: emp.id,
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        has_account: emp.user_accounts && emp.user_accounts.length > 0,
      }))

      setEmployees(processedEmployees || [])
    } catch (err: any) {
      console.error("Error assigning role:", err)
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
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Assign Role"}
        </Button>
      </CardContent>
    </Card>
  )
}
