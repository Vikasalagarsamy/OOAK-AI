import { DebugRejectionData } from "@/components/admin/debug-rejection-data"

export default function DebugRejectionDataPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Debug Lead Rejection Data</h1>
      <p className="text-muted-foreground mb-8">
        Use this tool to check and fix rejection data for leads that may have incorrect or missing information.
      </p>

      <DebugRejectionData />
    </div>
  )
}
