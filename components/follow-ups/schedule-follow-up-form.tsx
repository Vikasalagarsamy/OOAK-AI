export function ScheduleFollowUpForm({ leadId, leadName }: { leadId: number; leadName: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Schedule Follow-up for {leadName}</h3>
      <p>Follow-up scheduling form for lead ID: {leadId}</p>
    </div>
  )
}
