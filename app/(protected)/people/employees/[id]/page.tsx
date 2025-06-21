import { getEmployeeById } from "@/actions/employee-actions"
import { EmployeeDetailsCard } from "@/components/employee/employee-details-card"
import { redirect } from "next/navigation"

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const employeeId = parseInt(resolvedParams.id)

  const { success, data: employee, error } = await getEmployeeById(employeeId)

  if (!success || !employee) {
    redirect("/people/employees?error=employee_not_found")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Employee Details</h1>
      </div>
      
      <EmployeeDetailsCard employee={employee} />
    </div>
  )
}
