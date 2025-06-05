import { Suspense } from "react"
import { PeopleSubmenu } from "@/components/people/people-submenu"
import { EmployeeDashboard } from "@/components/employee-dashboard/employee-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export default function EmployeeDashboardPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of employee statistics, allocations, and department distribution.
        </p>
      </div>

      <PeopleSubmenu />

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <EmployeeDashboard />
      </Suspense>
    </div>
  )
}
