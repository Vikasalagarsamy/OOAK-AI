import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ScheduleFollowUpForm } from "@/components/follow-ups/schedule-follow-up-form"

interface ScheduleFollowUpPageProps {
  params: {
    leadId: string
  }
}

export default async function ScheduleFollowUpPage({ params }: ScheduleFollowUpPageProps) {
  const leadId = Number.parseInt(params.leadId)

  if (isNaN(leadId)) {
    notFound()
  }

  // Fetch lead details
  const supabase = createClient()
  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, lead_number, client_name")
    .eq("id", leadId)
    .single()

  if (error || !lead) {
    notFound()
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Schedule Follow-up</h1>
      <div className="max-w-2xl mx-auto">
        <ScheduleFollowUpForm leadId={lead.id} leadName={`${lead.client_name} (${lead.lead_number})`} />
      </div>
    </div>
  )
}
