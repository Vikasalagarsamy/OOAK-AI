"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { addEmployee, generateEmployeeId } from "@/actions/employee-actions"
import type { Department, Designation, Company, Branch } from "@/types/employee"
import { Save, X, Loader2, ChevronRight, ChevronLeft, User, Building, Briefcase } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AddEmployeeAllocations, type AllocationFormData } from "@/components/add-employee-allocations"

// Define the validation schema
const employeeFormSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  hire_date: z.date().optional(),
  job_title: z.string().optional(),
  department_id: z.string().optional(),
  designation_id: z.string().optional(),
  primary_company_id: z.string().optional(),
  home_branch_id: z.string().optional(),
  status: z.string().default("active"),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

interface AddEmployeeFormProps {
  departments: Department[]
  designations: Designation[]
  companies: Company[]
  branches: Branch[]
}

export function AddEmployeeForm({
  departments = [],
  designations = [],
  companies = [],
  branches = [],
}: AddEmployeeFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>(designations)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>(branches)
  const [generatedId, setGeneratedId] = useState<string>("")
  const [allocations, setAllocations] = useState<AllocationFormData[]>([])
  const [formProgress, setFormProgress] = useState({
    personal: false,
    address: false,
    employment: false,
    allocations: false,
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Initialize form with default values
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employee_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "USA",
      job_title: "",
      status: "active",
    },
  })

  // Generate employee ID on component mount
  useEffect(() => {
    const fetchEmployeeId = async () => {
      try {
        const id = await generateEmployeeId()
        setGeneratedId(id)
        form.setValue("employee_id", id)
      } catch (error) {
        console.error("Error generating employee ID:", error)
        toast({
          title: "Error",
          description: "Failed to generate employee ID",
          variant: "destructive",
        })
      }
    }

    fetchEmployeeId()
  }, [form, toast])

  // Update filtered designations when department changes
  const handleDepartmentChange = (value: string) => {
    setSelectedDepartmentId(value)
    form.setValue("department_id", value)

    // Clear designation when department changes
    form.setValue("designation_id", "")

    if (value && value !== "none") {
      const departmentId = Number.parseInt(value)
      // Filter designations by department_id
      const filtered = designations.filter((designation) => designation.department_id === departmentId)
      setFilteredDesignations(filtered)
    } else {
      // If no department is selected, show all designations
      setFilteredDesignations(designations)
    }
  }

  // Initialize filtered designations based on selected department
  useEffect(() => {
    if (departments.length > 0 && designations.length > 0) {
      const deptId = form.getValues("department_id")
      if (deptId && deptId !== "none") {
        handleDepartmentChange(deptId)
      }
    }
  }, [departments, designations])

  // Update filtered branches when company changes
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
    form.setValue("primary_company_id", value)

    if (value) {
      const companyId = Number.parseInt(value)
      setFilteredBranches(branches.filter((branch) => branch.company_id === companyId))
    } else {
      setFilteredBranches(branches)
    }

    // Clear branch if company changes
    form.setValue("home_branch_id", "")
  }

  // Watch for changes to update progress indicators
  const firstName = form.watch("first_name")
  const lastName = form.watch("last_name")
  const jobTitle = form.watch("job_title")
  const departmentId = form.watch("department_id")
  const primaryCompanyId = form.watch("primary_company_id")

  // Update form progress when specific fields change
  useEffect(() => {
    setFormProgress((prev) => ({
      ...prev,
      personal: !!firstName && !!lastName,
    }))
  }, [firstName, lastName])

  useEffect(() => {
    setFormProgress((prev) => ({
      ...prev,
      employment: !!jobTitle || !!departmentId || !!primaryCompanyId,
    }))
  }, [jobTitle, departmentId, primaryCompanyId])

  // Set address progress to true since it's optional
  useEffect(() => {
    setFormProgress((prev) => ({
      ...prev,
      address: true,
    }))
  }, [])

  useEffect(() => {
    setFormProgress((prev) => ({
      ...prev,
      allocations: allocations.length > 0,
    }))
  }, [allocations])

  // Handle form submission
  const onSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true)
    setFormError(null)

    try {
      // Validate allocations if any exist
      if (allocations.length > 0) {
        const totalAllocation = allocations.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)
        if (totalAllocation !== 100) {
          setFormError(`Total allocation percentage must equal 100%. Current total: ${totalAllocation}%`)
          setIsSubmitting(false)
          return
        }
      }

      // Convert form data to FormData
      const formData = new FormData()

      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, value.toISOString().split("T")[0])
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      // Include allocations data
      formData.append("allocations_json", JSON.stringify(allocations))

      const result = await addEmployee(formData)

      if (result?.success) {
        toast({
          title: "Employee added successfully",
          description: `${data.first_name} ${data.last_name} has been added to the system.`,
          variant: "default",
        })

        router.push("/people/employees")
      } else {
        setFormError(result?.error || "Failed to add employee. Please try again.")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error adding employee:", error)
      setFormError(error instanceof Error ? error.message : "An unknown error occurred")
      setIsSubmitting(false)
    }
  }

  // Add company allocations to form data
  const addCompanyAllocationsToFormData = (formData: FormData, employeeId: string) => {
    allocations.forEach((allocation, index) => {
      formData.append(`allocations[${index}][employee_id]`, employeeId)
      formData.append(`allocations[${index}][company_id]`, allocation.company_id.toString())
      formData.append(`allocations[${index}][branch_id]`, allocation.branch_id.toString())
      formData.append(`allocations[${index}][allocation_percentage]`, allocation.allocation_percentage.toString())
      formData.append(`allocations[${index}][is_primary]`, allocation.is_primary.toString())
    })

    return formData
  }

  // Navigate between tabs
  const navigateToTab = (tab: string) => {
    setActiveTab(tab)
  }

  // Get tab icon
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "personal":
        return <User className="h-4 w-4" />
      case "address":
        return <Building className="h-4 w-4" />
      case "employment":
        return <Briefcase className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {formError && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{formError}</p>
          </div>
        )}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Add New Employee</CardTitle>
                <CardDescription>Create a new employee record in the system</CardDescription>
              </div>
              <Badge variant={generatedId ? "outline" : "secondary"}>ID: {generatedId || "Generating..."}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Personal Info</span>
                  {formProgress.personal && <Badge variant="success" className="ml-2 h-2 w-2 rounded-full p-0" />}
                </TabsTrigger>
                <TabsTrigger value="address" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">Address</span>
                  {formProgress.address && <Badge variant="success" className="ml-2 h-2 w-2 rounded-full p-0" />}
                </TabsTrigger>
                <TabsTrigger value="employment" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Employment</span>
                  {formProgress.employment && <Badge variant="success" className="ml-2 h-2 w-2 rounded-full p-0" />}
                </TabsTrigger>
                <TabsTrigger value="allocations" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">Allocations</span>
                  {formProgress.allocations && <Badge variant="success" className="ml-2 h-2 w-2 rounded-full p-0" />}
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          First Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Last Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormDescription>Work email address for the employee</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => navigateToTab("address")}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Address Tab */}
              <TabsContent value="address" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, Apt 4B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip/Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigateToTab("personal")}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => navigateToTab("employment")}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Employment Tab */}
              <TabsContent value="employment" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={(value) => handleDepartmentChange(value)} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {departments.map((department) => (
                              <SelectItem key={department.id} value={department.id.toString()}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="designation_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedDepartmentId || selectedDepartmentId === "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  selectedDepartmentId && selectedDepartmentId !== "none"
                                    ? "Select designation"
                                    : "Select department first"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {filteredDesignations.length > 0
                              ? filteredDesignations.map((designation) => (
                                  <SelectItem key={designation.id} value={designation.id.toString()}>
                                    {designation.name}
                                  </SelectItem>
                                ))
                              : selectedDepartmentId &&
                                selectedDepartmentId !== "none" && (
                                  <div className="p-2 text-muted-foreground text-sm">
                                    No designations available for this department
                                  </div>
                                )}
                          </SelectContent>
                        </Select>
                        {selectedDepartmentId &&
                          selectedDepartmentId !== "none" &&
                          filteredDesignations.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              This department has no designations. Select a different department or create a designation
                              first.
                            </p>
                          )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hire_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Hire Date</FormLabel>
                        <DatePicker date={field.value} setDate={field.onChange} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primary_company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Company</FormLabel>
                        <Select onValueChange={(value) => handleCompanyChange(value)} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id.toString()}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home_branch_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Branch</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompanyId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedCompanyId ? "Select branch" : "Select company first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {filteredBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id.toString()}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on_leave">On Leave</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigateToTab("address")}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => navigateToTab("allocations")}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Company Allocations Tab */}
              <TabsContent value="allocations" className="space-y-4 pt-4">
                <AddEmployeeAllocations
                  companies={companies}
                  initialBranches={branches}
                  allocations={allocations}
                  setAllocations={setAllocations}
                  primaryCompanyId={form.watch("primary_company_id")}
                  primaryBranchId={form.watch("home_branch_id")}
                />

                <div className="flex justify-between space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigateToTab("employment")}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/people/employees")}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 ${isSubmitting ? "opacity-70" : ""}`}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Saving..." : "Save Employee"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
