import { UnassignedLeadsList } from "@/components/unassigned-leads-list"

export default function UnassignedLeadPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Unassigned Leads</h1>
      <UnassignedLeadsList />
    </div>
  )
}
