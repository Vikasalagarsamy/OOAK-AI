"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Employee {
  id: number
  name: string
  email: string
  role_id: number | null
}

interface Role {
  id: number
  title: string
}

export function EmployeeRoleManager() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", role_id: "none" })
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createClient()

  // Load employees and roles
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, title")
        .order("title")

      if (rolesError) throw rolesError
      setRoles(rolesData || [])

      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("id, name, email, role_id")
        .order("name")

      if (employeesError) throw employeesError
      setEmployees(employeesData || [])
    } catch (error: any) {
      console.error("Error loading data:", error)
      setError(`Failed to load data: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to load data. See console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial data loading
  useEffect(() => {
    loadData()
  }, [])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Data has been refreshed",
    })
  }

  // Handle adding new employee
  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase.from("employees").insert({
        name: newEmployee.name,
        email: newEmployee.email,
        role_id: newEmployee.role_id === "none" ? null : parseInt(newEmployee.role_id),
      }).select()

      if (error) throw error

      setEmployees([...employees, ...(data || [])])
      setNewEmployee({ name: "", email: "", role_id: "none" })
      toast({
        title: "Success",
        description: "Employee added successfully",
      })
    } catch (error: any) {
      console.error("Error adding employee:", error)
      toast({
        title: "Error",
        description: `Failed to add employee: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Handle role update
  const handleRoleUpdate = async (employeeId: number, roleId: string) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({ role_id: roleId === "none" ? null : parseInt(roleId) })
        .eq("id", employeeId)

      if (error) throw error

      setEmployees(employees.map(emp => 
        emp.id === employeeId 
          ? { ...emp, role_id: roleId === "none" ? null : parseInt(roleId) }
          : emp
      ))

      toast({
        title: "Success",
        description: "Role updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: `Failed to update role: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="default" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Employee Role Management</CardTitle>
            <CardDescription>
              Associate employees with user accounts and assign roles
            </CardDescription>
          </div>
          <Button variant="default" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add new employee form */}
            <div className="grid gap-4 p-4 border rounded-lg">
              <h3 className="font-medium">Add New Employee</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="Employee name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="Employee email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newEmployee.role_id}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, role_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddEmployee} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>

            {/* Employees table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <Select
                          value={employee.role_id?.toString() || ""}
                          onValueChange={(value) => handleRoleUpdate(employee.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Role</SelectItem>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleUpdate(employee.id, "")}
                        >
                          Remove Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 