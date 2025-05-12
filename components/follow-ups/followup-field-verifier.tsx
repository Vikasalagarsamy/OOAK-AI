"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle } from "lucide-react"
import { verifyFollowupField } from "@/actions/verify-followup-field"

export function FollowupFieldVerifier() {
  const [leadId, setLeadId] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  async function runVerification() {
    if (!leadId || isNaN(Number(leadId))) {
      setResult({
        success: false,
        message: "Please enter a valid lead ID",
      })
      return
    }

    setIsVerifying(true)
    setResult(null)

    try {
      const verificationResult = await verifyFollowupField(Number(leadId))
      setResult(verificationResult)
    } catch (error) {
      setResult({
        success: false,
        message: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          placeholder="Enter lead ID"
          type="number"
          className="max-w-xs"
        />
        <Button onClick={runVerification} disabled={isVerifying || !leadId}>
          {isVerifying ? "Verifying..." : "Run Verification"}
        </Button>
      </div>

      {result && (
        <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.message}
              </h3>
              {result.details && (
                <div className={`mt-2 text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                  {result.details}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
