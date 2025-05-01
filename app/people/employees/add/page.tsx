import { AddEmployeeForm } from "@/components/add-employee-form"
import { getDepartments, getDesignations, getCompanies, getBranches } from "@/actions/employee-actions"

export default async function AddEmployeePage() {
  try {
    // Fetch all required data for the form
    const [departments, designations, companies, branches] = await Promise.all([
      getDepartments(),
      getDesignations(),
      getCompanies(),
      getBranches(),
    ])

    // Log data for debugging
    console.log(`Fetched ${departments.length} departments for employee form`)

    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Add Employee</h1>
          <p className="text-muted-foreground">Create a new employee record with personal and work details.</p>
        </div>

        <AddEmployeeForm
          departments={departments}
          designations={designations}
          companies={companies}
          branches={branches}
        />
      </div>
    )
  } catch (error) {
    console.error("Error in AddEmployeePage:", error)
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Add Employee</h1>
          <p className="text-muted-foreground">Create a new employee record with personal and work details.</p>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p className="font-medium">Error loading employee form</p>
          <p className="text-sm">There was a problem loading the form data. Please try again later.</p>
        </div>
      </div>
    )
  }
}
