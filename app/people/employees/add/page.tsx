import { PeopleSubmenu } from "@/components/people/people-submenu"
import { AddEmployeeForm } from "@/components/add-employee-form"
import { getDepartments, getDesignations, getCompanies, getBranches } from "@/actions/employee-actions"

export default async function AddEmployeePage() {
  // Fetch all required data
  const departments = await getDepartments()
  const designations = await getDesignations()
  const companies = await getCompanies()
  const branches = await getBranches()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Add Employee</h1>
        <p className="text-muted-foreground">Create a new employee record in the system.</p>
      </div>

      <PeopleSubmenu />

      <AddEmployeeForm
        departments={departments || []}
        designations={designations || []}
        companies={companies || []}
        branches={branches || []}
      />
    </div>
  )
}
