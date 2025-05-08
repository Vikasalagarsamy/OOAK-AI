"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees from API
        const employeesResponse = await fetch("/api/employees")
        if (!employeesResponse.ok) {
          throw new Error(`Failed to fetch employees: ${employeesResponse.statusText}`)
        }
        const employeesData = await employeesResponse.json()
        setEmployees(employeesData || [])

        // Fetch roles from API
        const rolesResponse = await fetch("/api/roles")
        if (!rolesResponse.ok) {
          throw new Error(`Failed to fetch roles: ${rolesResponse.statusText}`)
        }
        const rolesData = await rolesResponse.json()
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

      // Use the API to handle role assignment
      const response = await fetch("/api/user-role-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          roleId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to assign role")
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: result.message,
      })

      // Reset form
      setSelectedEmployee("")
      setSelectedRole("")

      // Refresh employee list
      const refreshResponse = await fetch("/api/employees")
      if (!refreshResponse.ok) {
        throw new Error(`Failed to refresh employees: ${refreshResponse.statusText}`)
      }
      const refreshedEmployees = await refreshResponse.json()
      setEmployees(refreshedEmployees || [])
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
