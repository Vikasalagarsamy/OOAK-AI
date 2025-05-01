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
import {
  updateEmployee,
  getDepartments,
  getDesignations,
  getCompanies,
  getBranchesByCompany,
} from "@/actions/employee-actions"
import type { Employee, Department, Designation, Company, Branch } from "@/types/employee"

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, desigData, compData] = await Promise.all([getDepartments(), getDesignations(), getCompanies()])

        setDepartments(deptData)
        setDesignations(desigData)
        setCompanies(compData)

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
  }, [employee.primary_company_id])

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

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateEmployee(employee.id.toString(), new FormData(e.currentTarget))
      router.push(`/people/employees/${employee.id}`)
    } catch (error) {
      console.error("Error updating employee:", error)
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
                <Select name="department_id" defaultValue={employee.department_id?.toString() || ""}>
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
                <Select name="designation_id" defaultValue={employee.designation_id?.toString() || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {designations.map((desig) => (
                      <SelectItem key={desig.id} value={desig.id.toString()}>
                        {desig.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
