import { Suspense } from "react"
import { EmployeeDetailView } from "@/components/employee-detail-view"
import { Skeleton } from "@/components/ui/skeleton"
import { redirect } from "next/navigation"

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  // If the ID is "add", redirect to the add employee page
  if (params.id === "add") {
    redirect("/people/employees/add")
    return null
  }

  // For valid IDs, continue with the existing logic
  const id = Number.parseInt(params.id)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <EmployeeDetailView id={params.id} />
      </Suspense>
    </div>
  )
}
