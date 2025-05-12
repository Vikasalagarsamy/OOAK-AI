"use client"

import { FollowupFieldVerifier } from "@/components/follow-ups/followup-field-verifier"

export default function VerifyFollowupFieldPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Verify Follow-up Field Name Changes</h1>
      <p className="text-muted-foreground mb-8">
        This page allows you to verify that follow-ups can be scheduled correctly with the updated field name
        (followup_type instead of contact_method) after the database schema change.
      </p>

      <div className="grid gap-6">
        <FollowupFieldVerifier />

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
          <h2 className="text-md font-medium text-blue-800 mb-2">How to use this tool</h2>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Enter a valid lead ID from your database</li>
            <li>Click "Run Verification"</li>
            <li>The tool will attempt to create a follow-up with the updated field name</li>
            <li>Results will show whether the field name change was successful</li>
            <li>The test follow-up will be automatically deleted after verification</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
