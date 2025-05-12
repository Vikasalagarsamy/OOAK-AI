import { FollowupFieldVerifier } from "@/components/follow-ups/followup-field-verifier"

export default function VerifyFollowupFieldPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Verify Follow-up Field Name Changes</h1>
      <FollowupFieldVerifier />
    </div>
  )
}
