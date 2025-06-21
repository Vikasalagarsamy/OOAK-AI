import { FixLeadSources } from "@/components/fix-lead-sources"

export default function FixLeadSourcesPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Lead Sources Maintenance</h1>
      <div className="max-w-2xl">
        <FixLeadSources />
      </div>
    </div>
  )
}
