import { LeadSourceDebugger } from "@/components/debug/lead-source-debugger"

export default function DebugLeadSourcesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Debug Lead Sources</h1>
      <LeadSourceDebugger />
    </div>
  )
}
