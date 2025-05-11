"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { debugLeadRejectionData, syncLeadRejectionData } from "@/utils/debug-rejection-data"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export function DebugRejectionData() {
  const [leadId, setLeadId] = useState("")
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [syncResult, setSyncResult] = useState<any>(null)

  const handleDebug = async () => {
    if (!leadId || isNaN(Number(leadId))) {
      return
    }

    setLoading(true)
    setSyncResult(null)

    try {
      const data = await debugLeadRejectionData(Number(leadId))
      setResult(data)
    } catch (error) {
      console.error("Error debugging lead rejection data:", error)
      setResult({ success: false, message: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!leadId || isNaN(Number(leadId))) {
      return
    }

    setSyncing(true)

    try {
      const data = await syncLeadRejectionData(Number(leadId))
      setSyncResult(data)

      // Refresh debug data
      const refreshedData = await debugLeadRejectionData(Number(leadId))
      setResult(refreshedData)
    } catch (error) {
      console.error("Error syncing lead rejection data:", error)
      setSyncResult({ success: false, message: "An unexpected error occurred" })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Lead Rejection Data</CardTitle>
          <CardDescription>Check and fix rejection data for a specific lead</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="number"
              placeholder="Enter Lead ID"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleDebug} disabled={loading || !leadId}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Rejection Data"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.success ? "border-green-200" : "border-red-200"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {result.success ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Lead Data Retrieved
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Error Retrieving Lead Data
                  </div>
                )}
              </CardTitle>
              {result.success && (
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    "Sync Rejection Data"
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!result.success ? (
              <div className="text-red-600">{result.message}</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Lead Information</h3>
                  <pre className="mt-2 rounded bg-gray-100 p-4 text-sm overflow-auto max-h-60">
                    {JSON.stringify(result.lead, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Rejection Activities</h3>
                  {result.activities && result.activities.length > 0 ? (
                    <pre className="mt-2 rounded bg-gray-100 p-4 text-sm overflow-auto max-h-60">
                      {JSON.stringify(result.activities, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-yellow-600 mt-2">No rejection activities found</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium">Analysis</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="rounded bg-gray-100 p-4">
                      <p className="font-medium">Rejection Reason in Lead</p>
                      <p className={result.analysis.hasRejectionReason ? "text-green-600" : "text-red-600"}>
                        {result.analysis.hasRejectionReason ? "Present" : "Missing"}
                      </p>
                    </div>
                    <div className="rounded bg-gray-100 p-4">
                      <p className="font-medium">Rejected At in Lead</p>
                      <p className={result.analysis.hasRejectedAt ? "text-green-600" : "text-red-600"}>
                        {result.analysis.hasRejectedAt ? "Present" : "Missing"}
                      </p>
                    </div>
                    <div className="rounded bg-gray-100 p-4">
                      <p className="font-medium">Rejected By in Lead</p>
                      <p className={result.analysis.hasRejectedBy ? "text-green-600" : "text-red-600"}>
                        {result.analysis.hasRejectedBy ? "Present" : "Missing"}
                      </p>
                    </div>
                    <div className="rounded bg-gray-100 p-4">
                      <p className="font-medium">Rejection Activities</p>
                      <p className={result.analysis.activityCount > 0 ? "text-green-600" : "text-yellow-600"}>
                        {result.analysis.activityCount} found
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {syncResult && (
            <CardFooter className={`bg-${syncResult.success ? "green" : "red"}-50 p-4 rounded-b-lg`}>
              <div className={`text-${syncResult.success ? "green" : "red"}-600`}>{syncResult.message}</div>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  )
}
