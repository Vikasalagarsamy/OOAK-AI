import { Suspense } from "react"
import { EmployeeDetailView } from "@/components/employee-detail-view"
import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Employee Details</h1>
        <p className="text-muted-foreground">View and manage employee information and company allocations.</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <EmployeeDetailView id={params.id} />
      </Suspense>
    </div>
  )
}
