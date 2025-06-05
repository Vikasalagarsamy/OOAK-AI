import { FixLeadSourceIds } from "@/components/admin/fix-lead-source-ids"

export default function FixLeadSourceIdsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Lead Source ID Maintenance</h1>
      <FixLeadSourceIds />
    </div>
  )
}
