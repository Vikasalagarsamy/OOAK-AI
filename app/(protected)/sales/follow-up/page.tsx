import { SalesHeader } from "@/components/sales/sales-header"
import { FollowUpStats } from "@/components/follow-ups/follow-up-stats"
import { FollowUpList } from "@/components/follow-ups/follow-up-list"

export default function FollowUpPage() {
  return (
    <div>

      <FollowUpStats />

      {/* Follow-up list component */}
      <div className="bg-white rounded-lg shadow p-6">
        <FollowUpList />
      </div>
    </div>
  )
}
