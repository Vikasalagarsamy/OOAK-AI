"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the component with SSR disabled
const UnassignedLeadsList = dynamic(
  () => import("@/components/unassigned-leads-list").then((mod) => mod.UnassignedLeadsList),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    ),
  },
)

export default function UnassignedLeadPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Unassigned Leads</h1>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        }
      >
        <UnassignedLeadsList />
      </Suspense>
    </div>
  )
}
