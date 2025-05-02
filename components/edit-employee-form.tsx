"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  updateEmployee,
  getDepartments,
  getDesignations,
  getCompanies,
  getBranchesByCompany,
  getEmployeeCompanies,
} from "@/actions/employee-actions"
import type { Employee, Department, Designation, Company, Branch, EmployeeCompany } from "@/types/employee"
import { EmployeeCompaniesManager } from "@/components/employee-companies-manager"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

// Dynamically import the EnhancedCompanyAllocationForm with fallback
const EnhancedCompanyAllocationForm = dynamic(
  () => import("@/components/enhanced-company-allocation-form").then((mod) => mod.EnhancedCompanyAllocationForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading allocation form...</span>
      </div>
    ),
  },
)

interface EditEmployeeFormProps {
  employee: Employee
}

export function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    employee.primary_company_id ? String(employee.primary_company_id) : "",
  )
  const [isLoading, setIsLoading] = useState(true)
  const [employeeCompanies, setEmployeeCompanies] = useState<EmployeeCompany[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    employee.department_id ? String(employee.department_id) : "",
  )
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic-info")
  const [useEnhancedForm, setUseEnhancedForm] = useState(true)
  const [firstName, setFirstName] = useState(employee.first_name || "")
  const [lastName, setLastName] = useState(employee.last_name || "")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [deptData, desigData, compData] = await Promise.all([getDepartments(), getDesignations(), getCompanies()])

        setDepartments(deptData)
        setDesignations(desigData)
        setCompanies(compData)

        // Fetch employee companies separately to handle errors
        try {
          const empCompanies = await getEmployeeCompanies(employee.id.toString())
          setEmployeeCompanies(empCompanies)
        } catch (error) {
          console.error("Error fetching employee companies:", error)
          setUseEnhancedForm(false)
          setEmployeeCompanies([])
        }

        if (employee.primary_company_id) {
          const branchData = await getBranchesByCompany(employee.primary_company_id)
          setBranches(branchData)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching form data:", error)
        toast({
          title: "Error loading data",
          description: "There was an error loading the form data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchData()
  }, [employee.primary_company_id, employee.id])

  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedCompanyId || selectedCompanyId === "none") {
        setBranches([])
        return
      }

      try {
        const branchData = await getBranchesByCompany(Number.parseInt(selectedCompanyId))
        setBranches(branchData)
      } catch (error) {
        console.error("Error fetching branches:", error)
        toast({
          title: "Error loading branches",
          description: "Could not load branches for the selected company.",
          variant: "destructive",
        })
      }
    }

    fetchBranches()
  }, [selectedCompanyId])

  useEffect(() => {
    if (employee.department_id && designations.length > 0) {
      const filtered = designations.filter((designation) => designation.department_id === employee.department_id)
      setFilteredDesignations(filtered)
    } else {
      setFilteredDesignations(designations)
    }
  }, [employee.department_id, designations])

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
  }

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartmentId(value)

    if (value && value !== "none") {
      const departmentId = Number.parseInt(value)
      const filtered = designations.filter((designation) => designation.department_id === departmentId)
      setFilteredDesignations(filtered)
    } else {
      setFilteredDesignations(designations)
    }
  }

  const handlePrimaryCompanyChange = (companyId: number, branchId: number) => {
    // Update the form selections
    setSelectedCompanyId(String(companyId))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!firstName.trim()) {
      errors.firstName = "First name is required"
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required"
    }

    // Validate allocation percentages
    if (employeeCompanies.length > 0) {
      const totalAllocation = employeeCompanies.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)
      if (totalAllocation !== 100) {
        errors.allocations = `Total allocation must equal 100%. Current total: ${totalAllocation}%`
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Client-side validation
    if (!validateForm()) {
      setFormError("Please correct the errors before submitting.")

      // If there's an allocation error, switch to the allocations tab
      if (validationErrors.allocations) {
        setActiveTab("allocations")
      }

      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Ensure first name and last name are properly set
      formData.set("first_name", firstName)
      formData.set("last_name", lastName)

      const result = await updateEmployee(employee.id.toString(), formData)

      if (result?.success) {
        toast({
          title: "Employee updated successfully",
          description: `${firstName} ${lastName}'s information has been updated.`,
          variant: "default",
        })
        // Redirect to employee list page instead of individual employee page
        router.push("/people/employees")
      } else {
        setFormError(result?.error || "Failed to update employee. Please try again.")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error updating employee:", error)
      setFormError(error instanceof Error ? error.message : "An unknown error occurred")
      setIsSubmitting(false)
    }
  }

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  // Convert employee companies to the format expected by EnhancedCompanyAllocationForm
  const convertEmployeeCompanies = () => {
    if (!employeeCompanies || employeeCompanies.length === 0) {
      return []
    }

    return employeeCompanies.map((company) => ({
      id: company.id.toString(),
      company_id: company.company_id,
      company_name: company.company_name || "",
      branch_id: company.branch_id,
      branch_name: company.branch_name || "",
      project_id: company.project_id || null,
      project_name: company.project_name || null,
      allocation_percentage: company.allocation_percentage,
      is_primary: company.is_primary,
      start_date: company.start_date ? new Date(company.start_date) : new Date(),
      end_date: company.end_date ? new Date(company.end_date) : null,
      status: (company.status as "active" | "pending" | "completed" | "expired") || "active",
    }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading form data...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {formError && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{formError}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic-info">Basic Information</TabsTrigger>
          <TabsTrigger value="allocations" className={validationErrors.allocations ? "text-destructive" : ""}>
            Company & Project Allocations
            {validationErrors.allocations && <span className="ml-1">⚠️</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input id="employee_id" name="employee_id" defaultValue={employee.employee_id} disabled />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="first_name" className={validationErrors.firstName ? "text-destructive" : ""}>
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={validationErrors.firstName ? "border-destructive" : ""}
                    required
                  />
                  {validationErrors.firstName && (
                    <p className="text-destructive text-sm">{validationErrors.firstName}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="last_name" className={validationErrors.lastName ? "text-destructive" : ""}>
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={validationErrors.lastName ? "border-destructive" : ""}
                    required
                  />
                  {validationErrors.lastName && <p className="text-destructive text-sm">{validationErrors.lastName}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={employee.email || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={employee.phone || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    name="hire_date"
                    type="date"
                    defaultValue={formatDateForInput(employee.hire_date)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="termination_date">Termination Date</Label>
                  <Input
                    id="termination_date"
                    name="termination_date"
                    type="date"
                    defaultValue={formatDateForInput(employee.termination_date)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={employee.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input id="job_title" name="job_title" defaultValue={employee.job_title || ""} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="department_id">Department</Label>
                  <Select
                    name="department_id"
                    defaultValue={employee.department_id?.toString() || "none"}
                    onValueChange={handleDepartmentChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="designation_id">Designation</Label>
                  <Select
                    name="designation_id"
                    defaultValue={employee.designation_id?.toString() || "none"}
                    disabled={!selectedDepartmentId || selectedDepartmentId === "none"}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedDepartmentId && selectedDepartmentId !== "none"
                            ? "Select designation"
                            : "Select department first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {filteredDesignations.length > 0
                        ? filteredDesignations.map((desig) => (
                            <SelectItem key={desig.id} value={String(desig.id)}>
                              {desig.name}
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
                  {selectedDepartmentId && selectedDepartmentId !== "none" && filteredDesignations.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This department has no designations. Select a different department or create a designation first.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="primary_company_id">Primary Company</Label>
                  <Select
                    name="primary_company_id"
                    defaultValue={employee.primary_company_id?.toString() || "none"}
                    onValueChange={handleCompanyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Primary company can also be set through the company allocations tab
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="home_branch_id">Home Branch</Label>
                  <Select
                    name="home_branch_id"
                    defaultValue={employee.home_branch_id?.toString() || "none"}
                    disabled={!selectedCompanyId || selectedCompanyId === "none"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCompanyId ? "Select branch" : "Select company first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Home branch is automatically updated when setting a primary company allocation
                  </p>
                </div>

                <h3 className="text-lg font-medium pt-4">Address Information</h3>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" defaultValue={employee.address || ""} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" defaultValue={employee.city || ""} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" name="state" defaultValue={employee.state || ""} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="zip_code">Zip/Postal Code</Label>
                    <Input id="zip_code" name="zip_code" defaultValue={employee.zip_code || ""} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" defaultValue={employee.country || ""} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="allocations" className="mt-4">
          {validationErrors.allocations && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
              <p className="font-medium">Allocation Error</p>
              <p className="text-sm">{validationErrors.allocations}</p>
            </div>
          )}

          {useEnhancedForm ? (
            <EnhancedCompanyAllocationForm
              employeeId={employee.id.toString()}
              allocations={convertEmployeeCompanies()}
              onChange={(allocations) => {
                // Convert back to EmployeeCompany format
                const convertedAllocations = allocations.map((allocation) => ({
                  id: Number.parseInt(allocation.id),
                  employee_id: Number.parseInt(employee.id.toString()),
                  company_id: allocation.company_id,
                  company_name: allocation.company_name,
                  branch_id: allocation.branch_id,
                  branch_name: allocation.branch_name,
                  project_id: allocation.project_id,
                  project_name: allocation.project_name,
                  allocation_percentage: allocation.allocation_percentage,
                  is_primary: allocation.is_primary,
                  start_date: allocation.start_date,
                  end_date: allocation.end_date,
                  status: allocation.status,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }))
                setEmployeeCompanies(convertedAllocations)

                // Validate allocations whenever they change
                const totalAllocation = allocations.reduce(
                  (sum, allocation) => sum + allocation.allocation_percentage,
                  0,
                )
                if (totalAllocation !== 100 && allocations.length > 0) {
                  setValidationErrors({
                    ...validationErrors,
                    allocations: `Total allocation must equal 100%. Current total: ${totalAllocation}%`,
                  })
                } else {
                  // Clear the allocation error if it's fixed
                  const { allocations, ...restErrors } = validationErrors
                  setValidationErrors(restErrors)
                }
              }}
              onPrimaryChange={handlePrimaryCompanyChange}
            />
          ) : (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Company Allocations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manage which companies this employee works for and their allocation percentage. The primary company
                    affects reports, dashboards, and lead assignments.
                  </p>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4">
                    <p className="text-amber-800 text-sm font-medium">Important</p>
                    <p className="text-amber-700 text-sm">
                      Total allocation percentage must equal exactly 100% for all companies combined.
                    </p>
                  </div>

                  <EmployeeCompaniesManager
                    employeeId={employee.id.toString()}
                    employeeCompanies={employeeCompanies}
                    setEmployeeCompanies={(newCompanies) => {
                      setEmployeeCompanies(newCompanies)

                      // Validate allocations whenever they change
                      const totalAllocation = newCompanies.reduce(
                        (sum, allocation) => sum + allocation.allocation_percentage,
                        0,
                      )
                      if (totalAllocation !== 100 && newCompanies.length > 0) {
                        setValidationErrors({
                          ...validationErrors,
                          allocations: `Total allocation must equal 100%. Current total: ${totalAllocation}%`,
                        })
                      } else {
                        // Clear the allocation error if it's fixed
                        const { allocations, ...restErrors } = validationErrors
                        setValidationErrors(restErrors)
                      }
                    }}
                    onPrimaryCompanyChange={handlePrimaryCompanyChange}
                  />

                  {employeeCompanies.length > 0 && (
                    <div className="mt-4 text-sm">
                      <p className="font-medium">
                        Total Allocation:
                        <span
                          className={
                            employeeCompanies.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0) ===
                            100
                              ? " text-green-600"
                              : " text-destructive"
                          }
                        >
                          {" "}
                          {employeeCompanies.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)}%
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/people/employees")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
