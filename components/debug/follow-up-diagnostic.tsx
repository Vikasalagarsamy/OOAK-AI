"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { testFollowUpCreation } from "@/actions/follow-up-actions"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { VALID_FOLLOWUP_TYPES } from "@/actions/follow-up-actions"
import { CheckCircle, XCircle } from "lucide-react"

export function FollowUpDiagnostic() {
  const [leadId, setLeadId] = useState<string>("")
  const [followupType, setFollowupType] = useState<string>("phone")
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function runTest() {
    if (!leadId || isNaN(Number(leadId))) {
      setResult({
        success: false,
        message: "Please enter a valid Lead ID (number)",
      })
      return
    }

    setIsRunning(true)
    setResult(null)

    try {
      const diagnosticResult = await testFollowUpCreation(Number(leadId), followupType)
      setResult(diagnosticResult)
    } catch (error) {
      setResult({
        success: false,
        message: "Unexpected error during test",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Follow-up Creation Diagnostic</CardTitle>
        <CardDescription>Test follow-up creation functionality to diagnose issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="leadId" className="text-sm font-medium">
                Lead ID
              </label>
              <Input
                id="leadId"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                placeholder="Enter Lead ID"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-up Type</label>
              <Select value={followupType} onValueChange={setFollowupType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_FOLLOWUP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                {result.message}

                {result.error && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap">
                    {typeof result.error === "string" ? result.error : JSON.stringify(result.error, null, 2)}
                  </div>
                )}

                {result.data && (
                  <div className="mt-2">
                    <p className="font-medium text-sm">Response Data:</p>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs font-mono overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={runTest} disabled={isRunning}>
          {isRunning ? "Running Test..." : "Run Diagnostic Test"}
        </Button>
      </CardFooter>
    </Card>
  )
}
