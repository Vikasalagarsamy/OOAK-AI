import { EmployeeList } from "@/components/employee-list"
import { getEmployeesWithAllocations } from "@/actions/employee-list-actions"

export const dynamic = "force-dynamic"

export default async function EmployeesPage() {
  const employees = await getEmployeesWithAllocations()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage your organization's employees, their roles, and company allocations.
        </p>
      </div>

      <EmployeeList employees={employees} />
    </div>
  )
}
