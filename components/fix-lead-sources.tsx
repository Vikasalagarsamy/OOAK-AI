"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fixLeadSourcesActiveStatus } from "@/actions/fix-lead-sources-action"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function FixLeadSources() {
  const [isFixing, setIsFixing] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    updatedCount?: number
  }>({})
  const { toast } = useToast()

  const runFix = async () => {
    setIsFixing(true)
    try {
      // Call the server action
      const result = await fixLeadSourcesActiveStatus()
      setResult(result)

      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error running fix:", error)
      setResult({
        success: false,
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      })

      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Lead Sources Active Status</CardTitle>
        <CardDescription>
          This utility will fix the issue with inactive lead sources by setting all sources to active.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.success === true && (
          <div className="flex items-center p-4 mb-4 text-sm rounded-lg bg-green-50 text-green-800">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>
              {result.message}
              {result.updatedCount !== undefined && result.updatedCount > 0 && (
                <> {result.updatedCount} lead sources were updated.</>
              )}
              {result.updatedCount === 0 && <> No lead sources needed to be updated. All sources are already active.</>}
            </span>
          </div>
        )}

        {result.success === false && (
          <div className="flex items-center p-4 mb-4 text-sm rounded-lg bg-red-50 text-red-800">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{result.message}</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">This fix will:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
          <li>Set all inactive lead sources to active</li>
          <li>Ensure new sources are created as active by default in the application code</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Note: To add a database default constraint, please run the SQL script manually.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={runFix} disabled={isFixing}>
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing...
            </>
          ) : (
            "Run Fix"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
