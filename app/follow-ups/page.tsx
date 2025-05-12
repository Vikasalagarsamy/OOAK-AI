import { FollowUpDashboardPage } from "@/components/follow-ups/follow-up-dashboard-page"

export const metadata = {
  title: "Follow-up Management",
  description: "Manage and track your lead follow-up activities",
}

export default function FollowUpsPage() {
  return (
    <div className="container py-6">
      <FollowUpDashboardPage />
    </div>
  )
}
