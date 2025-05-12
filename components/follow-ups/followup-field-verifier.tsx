"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, Play } from "lucide-react"
import { checkAndAddIsTestColumn } from "@/actions/check-and-add-is-test-column"
import { verifyFollowupField } from "@/actions/verify-followup-field"

export function FollowupFieldVerifier() {
  const [leadId, setLeadId] = useState("")
  const [isPreparing, setIsPreparing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [prepareResult, setPrepareResult] = useState<any>(null)

  const handlePrepareDatabase = async () => {
    setIsPreparing(true)
    setPrepareResult(null)

    try {
      const result = await checkAndAddIsTestColumn()
      setPrepareResult(result)
    } catch (error) {
      console.error("Error preparing database:", error)
      setPrepareResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsPreparing(false)
    }
  }

  const handleVerify = async () => {
    if (!leadId.trim()) return

    setIsVerifying(true)
    setResult(null)

    try {
      const result = await verifyFollowupField(Number(leadId))
      setResult(result)
    } catch (error) {
      console.error("Error verifying field:", error)
      setResult({
        success: false,
        message: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Verify Follow-up Field Name Changes</CardTitle>
        <CardDescription>
          Verify that follow-ups can be scheduled with the updated field name (followup_type instead of contact_method)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Prepare Database */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Step 1: Prepare Database</h3>
          <div className="flex items-center gap-4">
            <Button onClick={handlePrepareDatabase} disabled={isPreparing} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {isPreparing ? "Preparing..." : "Prepare Database"}
            </Button>
            {prepareResult && (
              <span className={prepareResult.success ? "text-green-600" : "text-red-600"}>
                {prepareResult.success ? "Database prepared successfully" : "Failed to prepare database"}
              </span>
            )}
          </div>

          {prepareResult && !prepareResult.success && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {prepareResult.error || "Unknown error"}
                <div className="mt-2">
                  <p className="font-medium">Troubleshooting:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Check if you have the necessary database permissions</li>
                    <li>Try refreshing the page and trying again</li>
                    <li>Contact your database administrator</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Step 2: Run Verification */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Step 2: Run Verification</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Enter Lead ID"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
            <Button onClick={handleVerify} disabled={isVerifying || !leadId.trim()} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              {isVerifying ? "Verifying..." : "Run Verification"}
            </Button>
          </div>

          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className={result.success ? "bg-green-50 text-green-800 border-green-200" : ""}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.message}</AlertTitle>
              <AlertDescription>{result.details}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-md mt-6">
          <h3 className="font-medium text-blue-800 mb-2">How to use this tool:</h3>
          <ol className="list-decimal pl-5 text-blue-700 space-y-1">
            <li>First, click "Prepare Database" to ensure the database is ready</li>
            <li>Enter a valid lead ID from your database</li>
            <li>Click "Run Verification" to test the field name change</li>
            <li>The tool will attempt to create a follow-up with the updated field name</li>
            <li>Results will show whether the field name change was successful</li>
            <li>The test follow-up will be automatically deleted after verification</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
