"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-browser"
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

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        setError(null)
        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("id, employee_id, first_name, last_name, email")
          .order("first_name")

        if (employeesError) throw employeesError

        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase.from("roles").select("id, title").order("title")

        if (rolesError) throw rolesError

        // Check which employees already have accounts
        const { data: userAccounts, error: userAccountsError } = await supabase
          .from("user_accounts")
          .select("employee_id")

        if (userAccountsError) throw userAccountsError

        // Mark employees that already have accounts
        const employeesWithAccountFlag = employeesData?.map((employee) => ({
          ...employee,
          has_account: userAccounts?.some((account) => account.employee_id === employee.id) || false,
        }))

        setEmployees(employeesWithAccountFlag || [])
        setRoles(rolesData || [])
      } catch (err: any) {
        console.error("Error fetching data:", err)
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

      // Check if the employee already has an account
      const { data: existingAccount, error: checkError } = await supabase
        .from("user_accounts")
        .select("id")
        .eq("employee_id", employeeId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is the error code for "no rows returned"
        throw checkError
      }

      let result
      if (existingAccount) {
        // Update existing account
        const { error: updateError } = await supabase
          .from("user_accounts")
          .update({ role_id: roleId })
          .eq("id", existingAccount.id)

        if (updateError) throw updateError
        result = { message: `Role updated for ${employee.first_name} ${employee.last_name}` }
      } else {
        // Create new account
        // In a real app, you'd generate a password and send it to the user
        const tempPassword = Math.random().toString(36).slice(-8)

        const { error: insertError } = await supabase.from("user_accounts").insert({
          employee_id: employeeId,
          role_id: roleId,
          email: employee.email,
          password_hash: tempPassword, // In a real app, you'd hash this
          is_active: true,
          created_at: new Date().toISOString(),
        })

        if (insertError) throw insertError
        result = { message: `Account created for ${employee.first_name} ${employee.last_name}` }
      }

      toast({
        title: "Success",
        description: result.message,
      })

      // Reset form
      setSelectedEmployee("")
      setSelectedRole("")

      // Refresh employee list to update has_account flag
      const { data: refreshedEmployees, error: refreshError } = await supabase
        .from("employees")
        .select("id, employee_id, first_name, last_name, email")
        .order("first_name")

      if (refreshError) throw refreshError

      // Check which employees already have accounts
      const { data: userAccounts, error: userAccountsError } = await supabase
        .from("user_accounts")
        .select("employee_id")

      if (userAccountsError) throw userAccountsError

      // Mark employees that already have accounts
      const employeesWithAccountFlag = refreshedEmployees?.map((employee) => ({
        ...employee,
        has_account: userAccounts?.some((account) => account.employee_id === employee.id) || false,
      }))

      setEmployees(employeesWithAccountFlag || [])
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
                      {employee.has_account ? " (Has Account)" : ""}
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
