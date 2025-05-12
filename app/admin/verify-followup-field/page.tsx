import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FollowupFieldVerifier } from "@/components/follow-ups/followup-field-verifier"

export default function VerifyFollowupFieldPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Verify Follow-up Field Name Changes</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Field Name Verification Tool</CardTitle>
          <CardDescription>
            Verify that follow-ups can be scheduled with the updated field name (followup_type instead of
            contact_method)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FollowupFieldVerifier />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Enter a valid lead ID from your database</li>
            <li>Click "Run Verification"</li>
            <li>The tool will attempt to create a follow-up with the updated field name</li>
            <li>Results will show whether the field name change was successful</li>
            <li>The test follow-up will be automatically deleted after verification</li>
          </ol>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This tool will automatically add any missing columns required for testing. If you
              encounter any issues, please check the error details for more information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
