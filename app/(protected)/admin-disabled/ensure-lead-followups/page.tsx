import { EnsureLeadFollowupsTable } from "@/components/admin/ensure-lead-followups-table"

export default function EnsureLeadFollowupsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Ensure Lead Followups Table Exists</h1>
      <p className="mb-6">This utility will check if the lead_followups table exists and create it if needed.</p>
      <EnsureLeadFollowupsTable />
    </div>
  )
}
