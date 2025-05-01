import { AddEmployeeForm } from "@/components/add-employee-form"

export default function AddEmployeePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Add Employee</h1>
        <p className="text-muted-foreground">Create a new employee record with personal and work details.</p>
      </div>

      <AddEmployeeForm />
    </div>
  )
}
