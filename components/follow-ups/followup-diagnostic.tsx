"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertCircle, Info } from "lucide-react"

// Valid follow-up types according to the database constraint
const VALID_FOLLOWUP_TYPES = ["email", "phone", "in_person", "video_call", "text_message", "social_media", "other"]

export function FollowupDiagnostic() {
  const [leadId, setLeadId] = useState<string>("")
  const [followupType, setFollowupType] = useState<string>("phone")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    if (!leadId || isNaN(Number(leadId))) {
      setError("Please enter a valid lead ID")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Instead of calling an action directly, we'll use a simple fetch
      const response = await fetch(`/api/diagnostic/test-followup?leadId=${leadId}&type=${followupType}`)
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError("An unexpected error occurred during the diagnostic")
      console.error("Diagnostic error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Follow-up Diagnostic Tool</CardTitle>
        <CardDescription>Test the follow-up creation functionality to identify any issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="leadId" className="block text-sm font-medium mb-1">
              Lead ID
            </label>
            <Input
              id="leadId"
              type="number"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              placeholder="Enter a lead ID"
            />
          </div>
          <div>
            <label htmlFor="followupType" className="block text-sm font-medium mb-1">
              Follow-up Type
            </label>
            <Select value={followupType} onValueChange={setFollowupType}>
              <SelectTrigger id="followupType">
                <SelectValue placeholder="Select follow-up type" />
              </SelectTrigger>
              <SelectContent>
                {VALID_FOLLOWUP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={runDiagnostic} disabled={isLoading}>
            {isLoading ? "Running..." : "Run Diagnostic"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Failed"}</AlertTitle>
            <AlertDescription>
              <p>{result.message}</p>
              {result.error && (
                <div className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  <pre>{JSON.stringify(result.error, null, 2)}</pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>About Follow-up Types</AlertTitle>
          <AlertDescription>
            <p>The follow-up type must be one of the following values:</p>
            <ul className="list-disc list-inside mt-1 pl-2 grid grid-cols-2">
              {VALID_FOLLOWUP_TYPES.map((type) => (
                <li key={type} className="text-sm">
                  {type.replace("_", " ")}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        This tool helps identify data type mismatches and other issues with follow-up creation.
      </CardFooter>
    </Card>
  )
}
