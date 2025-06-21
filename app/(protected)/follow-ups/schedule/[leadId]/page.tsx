import { notFound } from "next/navigation"
import { createClient } from "@/lib/postgresql-client"
import { ScheduleFollowUpForm } from "@/components/follow-ups/schedule-follow-up-form"

interface ScheduleFollowUpPageProps {
  params: Promise<{
    leadId: string
  }>
}

export default async function ScheduleFollowUpPage({ params }: ScheduleFollowUpPageProps) {
  const resolvedParams = await params
  const leadId = Number.parseInt(resolvedParams.leadId)

  if (isNaN(leadId)) {
    notFound()
  }

  // Fetch lead details using PostgreSQL client
  try {
    const client = createClient()
    const result = await client.query(
      "SELECT id, lead_number, client_name FROM leads WHERE id = $1",
      [leadId]
    )

    if (result.rows.length === 0) {
      notFound()
    }

    const lead = result.rows[0]

    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Schedule Follow-up</h1>
        <div className="max-w-2xl mx-auto">
          <ScheduleFollowUpForm leadId={lead.id} leadName={`${lead.client_name} (${lead.lead_number})`} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching lead:", error)
    notFound()
  }
}
