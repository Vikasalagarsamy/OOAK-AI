"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { addEmployee } from "@/actions/employee-actions"
import type { Department, Designation, Company, Branch } from "@/types/employee"
import { IconButton } from "@/components/ui/icon-button"
import { Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>(designations)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>(branches)

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartmentId(value)
    if (value) {
      const departmentId = Number.parseInt(value)
      setFilteredDesignations(designations.filter((designation) => designation.department_id === departmentId))
    } else {
      setFilteredDesignations(designations)
    }
  }

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
    if (value) {
      const companyId = Number.parseInt(value)
      setFilteredBranches(branches.filter((branch) => branch.company_id === companyId))
    } else {
      setFilteredBranches(branches)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await addEmployee(formData)
      toast({
        title: "Employee added",
        description: "The employee has been successfully added.",
        variant: "default",
      })
      router.push("/people/employees")
    } catch (error) {
      console.error("Error adding employee:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employee",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Address</h3>
        <div className="grid gap-2">
          <Label htmlFor="address">Street Address</Label>
          <Textarea id="address" name="address" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">State/Province</Label>
            <Input id="state" name="state" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="zip_code">Zip/Postal Code</Label>
            <Input id="zip_code" name="zip_code" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue="USA" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Employment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="department_id">Department</Label>
            <Select name="department_id" onValueChange={handleDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id.toString()}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="designation_id">Designation</Label>
            <Select name="designation_id" disabled={!selectedDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder={selectedDepartmentId ? "Select designation" : "Select department first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredDesignations.map((designation) => (
                  <SelectItem key={designation.id} value={designation.id.toString()}>
                    {designation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job_title">Job Title</Label>
            <Input id="job_title" name="job_title" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hire_date">Hire Date</Label>
            <DatePicker name="hire_date" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="primary_company_id">Primary Company</Label>
            <Select name="primary_company_id" onValueChange={handleCompanyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
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
            <Select name="home_branch_id" disabled={!selectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder={selectedCompanyId ? "Select branch" : "Select company first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="active">
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
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <IconButton
          type="button"
          variant="outline"
          icon={X}
          label="Cancel"
          tooltipText="Cancel and return to employee list"
          onClick={() => router.push("/people/employees")}
          disabled={isSubmitting}
        />
        <IconButton
          type="submit"
          icon={isSubmitting ? Loader2 : Save}
          label={isSubmitting ? "Saving..." : "Save Employee"}
          tooltipText="Save the new employee"
          disabled={isSubmitting}
          className={isSubmitting ? "opacity-70" : ""}
        />
      </div>
    </form>
  )
}
