import { EnsureLeadSourcesTable } from "@/components/ensure-lead-sources-table"

export default function EnsureTablesPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Database Table Management</h1>

      <div className="space-y-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Lead Sources Table</h2>
          <p className="mb-4 text-muted-foreground">
            Ensure the lead_sources table exists in your database. This is required for proper lead management.
          </p>
          <EnsureLeadSourcesTable />
        </div>
      </div>
    </div>
  )
}
