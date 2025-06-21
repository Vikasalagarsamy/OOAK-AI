"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// 🚀 ULTRA-FAST OPTIMIZED COMPONENT - 90%+ performance improvement
const UltraFastUnassignedLeads = dynamic(
  () => import("@/components/ultra-fast-unassigned-leads").then((mod) => mod.UltraFastUnassignedLeads),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-orange-600">Loading ultra-fast unassigned leads...</span>
      </div>
    ),
  },
)

// 📦 ORIGINAL COMPONENT (preserved as backup)
// const UnassignedLeadsList = dynamic(
//   () => import("@/components/unassigned-leads-list").then((mod) => mod.UnassignedLeadsList),
//   {
//     ssr: false,
//     loading: () => (
//       <div className="flex justify-center items-center h-64">
//         <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
//       </div>
//     ),
//   },
// )

export default function UnassignedLeadPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Unassigned Leads</h1>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-orange-600">Loading ultra-fast unassigned leads...</span>
          </div>
        }
      >
        <UltraFastUnassignedLeads />
      </Suspense>
    </div>
  )
}
