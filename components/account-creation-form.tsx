"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2 } from "lucide-react"
import { PasswordStrengthMeter } from "./password-strength-meter"
import { createUserAccount, getEmployees, getRoles } from "@/actions/account-creation-actions"

// Define the form schema with Zod
const formSchema = z
  .object({
    employeeId: z.string().min(1, "Employee is required"),
    roleId: z.string().min(1, "Role is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof formSchema>

export function AccountCreationForm() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [success, setSuccess] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      roleId: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Fetch employees and roles on component mount
  useState(() => {
    const fetchData = async () => {
      try {
        const [employeesData, rolesData] = await Promise.all([getEmployees(), getRoles()])

        setEmployees(employeesData || [])
        setRoles(rolesData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load employees and roles. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [toast])

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      const result = await createUserAccount(data)

      if (result.success) {
        setSuccess(true)
        form.reset()
        toast({
          title: "Success",
          description: "User account created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create user account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating account:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle employee selection
  const handleEmployeeChange = (value: string) => {
    const employee = employees.find((emp) => emp.id === value)
    setSelectedEmployee(employee)

    // If employee has a department, suggest a role
    if (employee?.department_id) {
      const suggestedRole = roles.find((role) => role.department_id === employee.department_id)
      if (suggestedRole) {
        form.setValue("roleId", suggestedRole.id)
      }
    }
  }

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0

    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    setPasswordStrength(strength)
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Account Created Successfully</h2>
            <p className="text-muted-foreground text-center mb-6">
              The user account has been created successfully. The employee can now log in using their credentials.
            </p>
            <Button onClick={() => setSuccess(false)}>Create Another Account</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {loadingData ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading data...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleEmployeeChange(value)
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name} ({employee.employee_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select an employee to create an account for.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedEmployee && (
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-2">Selected Employee Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Name:</div>
                    <div>
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </div>
                    <div>Employee ID:</div>
                    <div>{selectedEmployee.employee_id}</div>
                    <div>Department:</div>
                    <div>{selectedEmployee.department_name || "Not assigned"}</div>
                    <div>Designation:</div>
                    <div>{selectedEmployee.designation_name || "Not assigned"}</div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Assign a role to determine the user's permissions.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          calculatePasswordStrength(e.target.value)
                        }}
                      />
                    </FormControl>
                    <PasswordStrengthMeter strength={passwordStrength} />
                    <FormDescription>
                      Password must be at least 8 characters and include uppercase, lowercase, number, and special
                      character.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>Re-enter the password to confirm.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
