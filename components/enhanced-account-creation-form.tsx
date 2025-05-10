"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import {
  getEmployeesEnhanced,
  getRolesEnhanced,
  createUserAccountEnhanced,
  checkEmployeesAndRolesExist,
} from "@/actions/enhanced-account-creation-actions"

export function EnhancedAccountCreationForm() {
  const [employees, setEmployees] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")
  const [prerequisiteCheck, setPrerequisiteCheck] = useState<{
    checked: boolean
    employeesExist: boolean
    rolesExist: boolean
    error: string | null
  }>({
    checked: false,
    employeesExist: false,
    rolesExist: false,
    error: null,
  })

  // Check prerequisites
  const checkPrerequisites = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await checkEmployeesAndRolesExist()

      setPrerequisiteCheck({
        checked: true,
        employeesExist: result.employeesExist || false,
        rolesExist: result.rolesExist || false,
        error: result.error || null,
      })

      if (result.success && result.employeesExist && result.rolesExist) {
        await loadData()
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      console.error("Error checking prerequisites:", err)
      setPrerequisiteCheck({
        checked: true,
        employeesExist: false,
        rolesExist: false,
        error: err.message || "Failed to check prerequisites",
      })
      setLoading(false)
    }
  }

  // Load employees and roles
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch employees
      const employeesResult = await getEmployeesEnhanced()
      if (!employeesResult.success) {
        throw new Error(employeesResult.error || "Failed to fetch employees")
      }
      setEmployees(employeesResult.data || [])

      // Fetch roles
      const rolesResult = await getRolesEnhanced()
      if (!rolesResult.success) {
        throw new Error(rolesResult.error || "Failed to fetch roles")
      }
      setRoles(rolesResult.data || [])

      setLoading(false)
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(err.message || "An error occurred while loading data")
      setLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!selectedEmployee) {
      setError("Please select an employee")
      return
    }

    if (!selectedRole) {
      setError("Please select a role")
      return
    }

    if (!password) {
      setError("Please enter a password")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const result = await createUserAccountEnhanced({
        employeeId: selectedEmployee,
        roleId: selectedRole,
        password,
      })

      if (result.success) {
        setSuccess(true)
        setMessage("Account created successfully")
        setSelectedEmployee("")
        setSelectedRole("")
        setPassword("")
        setConfirmPassword("")

        // Reload employees to update the list
        await loadData()
      } else {
        setError(result.error || "Failed to create account")
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Error creating account:", err)
      setError(err.message || "An error occurred while creating the account")
      setLoading(false)
    }
  }

  // Initialize the form
  useEffect(() => {
    checkPrerequisites()
  }, [])

  // Render the form
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create User Account</CardTitle>
        <CardDescription>Create a new user account for an employee and assign a role.</CardDescription>
      </CardHeader>

      <CardContent>
        {loading && <div className="flex items-center justify-center py-4">Loading...</div>}

        {!loading &&
          prerequisiteCheck.checked &&
          (!prerequisiteCheck.employeesExist || !prerequisiteCheck.rolesExist) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Prerequisites Not Met</AlertTitle>
              <AlertDescription>
                {!prerequisiteCheck.employeesExist && <div>No employees found in the database.</div>}
                {!prerequisiteCheck.rolesExist && <div>No roles found in the database.</div>}
                {prerequisiteCheck.error && <div>Error: {prerequisiteCheck.error}</div>}
                <div className="mt-2">
                  Please make sure you have created employees and roles before creating user accounts.
                </div>
              </AlertDescription>
            </Alert>
          )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-600">{message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="form">
          <TabsList className="mb-4">
            <TabsTrigger value="form">Account Form</TabsTrigger>
            <TabsTrigger value="debug">Debug Info</TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                    disabled={loading || employees.length === 0}
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading || roles.length === 0}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.role_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={loadData} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

                <Button type="submit" disabled={loading}>
                  Create Account
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="debug">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Prerequisite Check</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(prerequisiteCheck, null, 2)}</pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">Employees ({employees.length})</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm">
                  {JSON.stringify(employees.slice(0, 3), null, 2)}
                  {employees.length > 3 && "\n...and " + (employees.length - 3) + " more"}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">Roles ({roles.length})</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(roles, null, 2)}</pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">{employees.length > 0 && `${employees.length} employees available`}</div>
        <div className="text-sm text-gray-500">{roles.length > 0 && `${roles.length} roles available`}</div>
      </CardFooter>
    </Card>
  )
}
