"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { simpleFixLeadFollowups } from "@/actions/simple-fix-lead-followups"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function FixLeadFollowupsTable() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFix() {
    setIsLoading(true)
    setError(null)

    try {
      const result = await simpleFixLeadFollowups()
      setResult(result)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        setError(result.message)
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error fixing lead_followups table:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      setResult({
        success: false,
        message: errorMessage,
      })

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Lead Followups Table</CardTitle>
        <CardDescription>
          This will check and fix the structure of the lead_followups table to ensure it has the correct columns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <h4 className="font-semibold mb-2">Error Details:</h4>
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleFix} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              Fixing...
            </>
          ) : (
            "Fix Lead Followups Table"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
