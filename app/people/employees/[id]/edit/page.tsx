import { notFound } from "next/navigation"
import { PeopleSubmenu } from "@/components/people/people-submenu"
import { EditEmployeeForm } from "@/components/edit-employee-form"
import { getEmployee } from "@/actions/employee-actions"

export const dynamic = "force-dynamic"

interface EditEmployeePageProps {
  params: {
    id: string
  }
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  try {
    const employee = await getEmployee(params.id)

    if (!employee) {
      notFound()
    }

    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit Employee</h1>
          <p className="text-muted-foreground">Update employee information and work details.</p>
        </div>

        <PeopleSubmenu />

        <EditEmployeeForm employee={employee} />
      </div>
    )
  } catch (error) {
    console.error("Error fetching employee:", error)
    notFound()
  }
}
