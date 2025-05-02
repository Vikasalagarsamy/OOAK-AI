import { Suspense } from "react"
import { EmployeeDetailView } from "@/components/employee-detail-view"
import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <EmployeeDetailView id={params.id} />
      </Suspense>
    </div>
  )
}
