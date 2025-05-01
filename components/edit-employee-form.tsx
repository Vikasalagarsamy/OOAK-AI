"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  updateEmployee,
  getDepartments,
  getDesignations,
  getCompanies,
  getBranchesByCompany,
  getEmployeeCompanies,
} from "@/actions/employee-actions"
import type { Employee, Department, Designation, Company, Branch } from "@/types/employee"
import { EmployeeCompaniesManager } from "@/components/employee-companies-manager"
import type { EmployeeCompany } from "@/types/employee-company"

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
    employee.primary_company_id ? employee.primary_company_id.toString() : "",
  )
  const [isLoading, setIsLoading] = useState(true)
  const [employeeCompanies, setEmployeeCompanies] = useState<EmployeeCompany[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    employee.department_id ? employee.department_id.toString() : "",
  )
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, desigData, compData, empCompanies] = await Promise.all([
          getDepartments(),
          getDesignations(),
          getCompanies(),
          getEmployeeCompanies(employee.id.toString()),
        ])

        setDepartments(deptData)
        setDesignations(desigData)
        setCompanies(compData)
        setEmployeeCompanies(empCompanies)

        if (employee.primary_company_id) {
          const branchData = await getBranchesByCompany(employee.primary_company_id)
          setBranches(branchData)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching form data:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [employee.primary_company_id, employee.id])

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      const result = await updateEmployee(employee.id.toString(), new FormData(e.currentTarget))

      if (result?.success) {
        toast({
          title: "Employee updated successfully",
          description: `${employee.first_name} ${employee.last_name}'s information has been updated.`,
          variant: "default",
        })
        router.push(`/people/employees/${employee.id}`)
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading form data...</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      {formError && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{formError}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="grid gap-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input id="employee_id" name="employee_id" defaultValue={employee.employee_id} disabled />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" name="first_name" defaultValue={employee.first_name} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" name="last_name" defaultValue={employee.last_name} required />
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Organization Details</h3>

              <div className="grid gap-2">
                <Label htmlFor="department_id">Department</Label>
                <Select
                  name="department_id"
                  defaultValue={employee.department_id?.toString() || ""}
                  onValueChange={handleDepartmentChange}
                >
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
                <Select
                  name="designation_id"
                  defaultValue={employee.designation_id?.toString() || ""}
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
                <Select
                  name="primary_company_id"
                  defaultValue={employee.primary_company_id?.toString() || ""}
                  onValueChange={handleCompanyChange}
                >
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="home_branch_id">Home Branch</Label>
                <Select
                  name="home_branch_id"
                  defaultValue={employee.home_branch_id?.toString() || ""}
                  disabled={!selectedCompanyId}
                >
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
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Allocations</h3>
              <p className="text-sm text-muted-foreground">
                Manage which companies this employee works for and their allocation percentage.
              </p>

              <EmployeeCompaniesManager
                employeeId={employee.id.toString()}
                employeeCompanies={employeeCompanies}
                setEmployeeCompanies={setEmployeeCompanies}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/people/employees/${employee.id}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
