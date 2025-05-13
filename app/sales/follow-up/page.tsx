import { SalesHeader } from "@/components/sales/sales-header"
import { SalesSubmenu } from "@/components/sales/sales-submenu"
import { FollowUpStats } from "@/components/follow-ups/follow-up-stats"

export default function FollowUpPage() {
  return (
    <div>
      <SalesHeader title="Follow Up Management" description="Schedule and track follow-ups with potential clients" />

      <SalesSubmenu />

      <FollowUpStats />

      {/* Rest of the follow-up page content */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Follow-ups</h2>
        {/* Follow-up list component would go here */}
        <p className="text-muted-foreground">Your upcoming follow-ups will appear here.</p>
      </div>
    </div>
  )
}
