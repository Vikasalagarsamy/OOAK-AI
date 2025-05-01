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
  createEmployee,
  getDepartments,
  getDesignations,
  getCompanies,
  getBranchesByCompany,
  generateEmployeeId,
} from "@/actions/employee-actions"
import type { Department, Designation, Company, Branch } from "@/types/employee"
import { CompanyAllocationForm } from "@/components/company-allocation-form"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface CompanyAllocation {
  id: string
  company_id: number
  company_name: string
  branch_id: number
  branch_name: string
  allocation_percentage: number
  is_primary: boolean
}

export function AddEmployeeForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState<string>("")
  const [formError, setFormError] = useState<string | null>(null)
  const [allocations, setAllocations] = useState<CompanyAllocation[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [deptData, desigData, compData, empId] = await Promise.all([
          getDepartments(),
          getDesignations(),
          getCompanies(),
          generateEmployeeId(),
        ])

        setDepartments(deptData)
        setDesignations(desigData)
        setCompanies(compData)
        setEmployeeId(empId)
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
  }, [])

  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedCompanyId) {
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
    if (selectedDepartmentId && selectedDepartmentId !== "none") {
      const departmentId = Number.parseInt(selectedDepartmentId)
      const filtered = designations.filter((designation) => designation.department_id === departmentId)
      setFilteredDesignations(filtered)
    } else {
      setFilteredDesignations([])
    }
  }, [selectedDepartmentId, designations])

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
  }

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartmentId(value)
  }

  const handlePrimaryCompanyChange = (companyId: number, branchId: number) => {
    setSelectedCompanyId(companyId.toString())
  }

  const handleAllocationsChange = (newAllocations: CompanyAllocation[]) => {
    setAllocations(newAllocations)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    // Validate allocations
    const totalAllocation = allocations.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)
    if (allocations.length > 0 && totalAllocation !== 100) {
      setFormError(`Total allocation must equal 100%. Current total: ${totalAllocation}%`)
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData(e.currentTarget)

      // Add allocations JSON
      formData.set("allocations_json", JSON.stringify(allocations))

      const result = await createEmployee(formData)

      if (result?.success) {
        toast({
          title: "Employee added successfully",
          description: "The new employee has been added to the system.",
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
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input id="employee_id" name="employee_id" defaultValue={employeeId} readOnly />
              <p className="text-xs text-muted-foreground">Auto-generated employee ID</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="first_name" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" name="last_name" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" name="job_title" />
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
              <Select name="department_id" onValueChange={handleDepartmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="designation_id">Designation</Label>
              <Select name="designation_id" disabled={!selectedDepartmentId || selectedDepartmentId === "none"}>
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
                        <SelectItem key={desig.id} value={desig.id.toString()}>
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
              <Select name="primary_company_id" value={selectedCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Primary company can also be set through the company allocations below
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="home_branch_id">Home Branch</Label>
              <Select name="home_branch_id" disabled={!selectedCompanyId || selectedCompanyId === "none"}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedCompanyId ? "Select branch" : "Select company first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
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
              <Textarea id="address" name="address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="state">State/Province</Label>
                <Input id="state" name="state" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="zip_code">Zip/Postal Code</Label>
                <Input id="zip_code" name="zip_code" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <CompanyAllocationForm
            allocations={allocations}
            onChange={handleAllocationsChange}
            onPrimaryChange={handlePrimaryCompanyChange}
          />
        </div>
      </div>

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
              Adding Employee...
            </>
          ) : (
            "Add Employee"
          )}
        </Button>
      </div>
    </form>
  )
}
