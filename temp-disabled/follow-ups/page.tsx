import { Suspense } from "react"
import { FollowUpDashboardPage } from "@/components/follow-ups/follow-up-dashboard-page"

export const metadata = {
  title: "Follow-up Management",
  description: "Manage and track your lead follow-up activities",
}

export default function FollowUpsPage() {
  return (
    <div className="container py-6">
      <Suspense fallback={<div>Loading follow-up dashboard...</div>}>
        <FollowUpDashboardPage />
      </Suspense>
    </div>
  )
}
