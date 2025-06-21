import DiagnosticClient from "./client"

// Disable static generation for this page
export const dynamic = "force-dynamic"

export default function FollowupDiagnosticPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Follow-up System Diagnostic</h1>
      <p className="mb-6 text-muted-foreground">
        Use this tool to diagnose issues with the follow-up scheduling system.
      </p>

      <DiagnosticClient />
    </div>
  )
}
