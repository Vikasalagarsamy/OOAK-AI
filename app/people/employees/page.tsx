import { Suspense } from "react"
import { PeopleSubmenu } from "@/components/people/people-submenu"
import { EmployeeList } from "@/components/employee-list"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function EmployeesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your organization's employees</p>
        </div>
        <Link href="/people/employees/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      <PeopleSubmenu />

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <EmployeeList />
      </Suspense>
    </div>
  )
}
