"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { verifyFollowupField } from "@/actions/verify-followup-field"
import { addIsTestColumnToFollowups } from "@/actions/add-is-test-column"

export function FollowupFieldVerifier() {
  const [leadId, setLeadId] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isPreparingDb, setIsPreparingDb] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  async function prepareDatabase() {
    setIsPreparingDb(true)
    setResult(null)

    try {
      const columnResult = await addIsTestColumnToFollowups()

      if (!columnResult.success) {
        setResult({
          success: false,
          message: "Failed to prepare database",
          details: columnResult.error || "Could not add required columns",
        })
        return false
      }

      setResult({
        success: true,
        message: "Database prepared successfully",
        details: "Required columns have been added to the database",
      })
      return true
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to prepare database",
        details: error instanceof Error ? error.message : String(error),
      })
      return false
    } finally {
      setIsPreparingDb(false)
    }
  }

  async function runVerification() {
    if (!leadId || isNaN(Number(leadId))) {
      setResult({
        success: false,
        message: "Please enter a valid lead ID",
        details: "Lead ID must be a number",
      })
      return
    }

    setIsVerifying(true)
    setResult(null)

    try {
      const verificationResult = await verifyFollowupField(Number(leadId))
      setResult(verificationResult)
    } catch (error) {
      console.error("Error in verification:", error)
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
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={prepareDatabase} disabled={isPreparingDb} variant="outline" className="mb-2 sm:mb-0">
          {isPreparingDb ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing Database...
            </>
          ) : (
            "1. Prepare Database"
          )}
        </Button>

        <div className="flex gap-2 flex-1">
          <Input
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            placeholder="Enter lead ID"
            type="number"
            className="max-w-xs"
            disabled={isVerifying}
          />
          <Button onClick={runVerification} disabled={isVerifying || !leadId || isPreparingDb}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "2. Run Verification"
            )}
          </Button>
        </div>
      </div>

      {result && (
        <div
          className={`p-4 rounded-md ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
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
