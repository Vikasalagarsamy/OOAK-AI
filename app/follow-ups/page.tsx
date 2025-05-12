import { FollowUpList } from "@/components/follow-ups/follow-up-list"

export default function FollowUpsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Follow-ups</h1>
      <FollowUpList />
    </div>
  )
}
