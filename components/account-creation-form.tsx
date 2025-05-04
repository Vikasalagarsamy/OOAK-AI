"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import { createUserAccount, getEmployees, getRoles } from "@/actions/account-creation-actions"

const formSchema = z
  .object({
    employeeId: z.string({
      required_error: "Please select an employee.",
    }),
    roleId: z.string({
      required_error: "Please select a role.",
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof formSchema>

export function AccountCreationForm() {
  const [employees, setEmployees] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(true)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [success, setSuccess] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

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
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees()
        setEmployees(data)
      } catch (error) {
        console.error("Error fetching employees:", error)
        toast({
          title: "Error",
          description: "Failed to load employees. Please try again.",
          variant: "destructive",
        })
      } finally {
        setEmployeesLoading(false)
      }
    }

    const fetchRoles = async () => {
      try {
        const data = await getRoles()
        setRoles(data)
      } catch (error) {
        console.error("Error fetching roles:", error)
        toast({
          title: "Error",
          description: "Failed to load roles. Please try again.",
          variant: "destructive",
        })
      } finally {
        setRolesLoading(false)
      }
    }

    fetchEmployees()
    fetchRoles()
  }, [])

  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0

    let strength = 0

    // Length check
    if (password.length >= 8) strength += 1
    if (password.length >= 12) strength += 1

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    // Normalize to 0-100
    return Math.min(Math.floor((strength / 6) * 100), 100)
  }

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    form.setValue("password", password)
    setPasswordStrength(calculatePasswordStrength(password))
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      const result = await createUserAccount({
        employeeId: data.employeeId,
        roleId: data.roleId,
        password: data.password,
      })

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Account Created",
          description: "User account has been created successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create account. Please try again.",
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
      setIsLoading(false)
    }
  }

  const handleEmployeeSelect = (employeeId: string) => {
    form.setValue("employeeId", employeeId)
    const employee = employees.find((emp) => emp.id === employeeId)
    setSelectedEmployee(employee)

    // Suggest a role based on employee department if available
    if (employee?.department_id) {
      const suggestedRole = roles.find((role) => role.department_id === employee.department_id)
      if (suggestedRole) {
        form.setValue("roleId", suggestedRole.id)
      }
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="rounded-full bg-green-100 p-3 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-medium mb-2">Account Created Successfully</h3>
        <p className="text-muted-foreground text-center mb-6">
          The user account has been created and is now ready to use.
        </p>
        <Button
          onClick={() => {
            setSuccess(false)
            form.reset()
            setPasswordStrength(0)
          }}
        >
          Create Another Account
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Employee</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("justify-between", !field.value && "text-muted-foreground")}
                      disabled={employeesLoading}
                    >
                      {employeesLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading employees...
                        </div>
                      ) : field.value ? (
                        employees.find((employee) => employee.id === field.value)?.full_name || "Select employee"
                      ) : (
                        "Select employee"
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[400px]">
                  <Command>
                    <CommandInput placeholder="Search employees..." />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.id}
                            onSelect={() => handleEmployeeSelect(employee.id)}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4", employee.id === field.value ? "opacity-100" : "opacity-0")}
                            />
                            <div className="flex flex-col">
                              <span>{employee.full_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {employee.employee_id} • {employee.department_name || "No Department"}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Select the employee for whom you want to create an account.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedEmployee && (
          <div className="bg-muted p-3 rounded-md">
            <h4 className="font-medium mb-2">Selected Employee</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {selectedEmployee.full_name}
              </div>
              <div>
                <span className="text-muted-foreground">ID:</span> {selectedEmployee.employee_id}
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span> {selectedEmployee.department_name || "N/A"}
              </div>
              <div>
                <span className="text-muted-foreground">Designation:</span> {selectedEmployee.designation_name || "N/A"}
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Role</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("justify-between", !field.value && "text-muted-foreground")}
                      disabled={rolesLoading}
                    >
                      {rolesLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading roles...
                        </div>
                      ) : field.value ? (
                        roles.find((role) => role.id === field.value)?.role_title || "Select role"
                      ) : (
                        "Select role"
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[300px]">
                  <Command>
                    <CommandInput placeholder="Search roles..." />
                    <CommandList>
                      <CommandEmpty>No role found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {roles.map((role) => (
                          <CommandItem key={role.id} value={role.id} onSelect={() => form.setValue("roleId", role.id)}>
                            <Check
                              className={cn("mr-2 h-4 w-4", role.id === field.value ? "opacity-100" : "opacity-0")}
                            />
                            <div className="flex flex-col">
                              <span>{role.role_title}</span>
                              {role.description && (
                                <span className="text-xs text-muted-foreground">{role.description}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Assign a role to determine the user&apos;s permissions.</FormDescription>
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
                <Input type="password" placeholder="Enter password" {...field} onChange={onPasswordChange} />
              </FormControl>
              <div className="mt-2">
                <PasswordStrengthMeter strength={passwordStrength} />
              </div>
              <FormDescription>
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
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
                <Input type="password" placeholder="Confirm password" {...field} />
              </FormControl>
              <FormDescription>Re-enter the password to confirm.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  )
}
