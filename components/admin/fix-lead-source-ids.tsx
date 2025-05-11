"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"
import { updateMissingLeadSourceIds } from "@/actions/update-lead-sources"

export function FixLeadSourceIds() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    updatedLeads?: string[]
  } | null>(null)

  const handleFix = async () => {
    setLoading(true)
    try {
      const result = await updateMissingLeadSourceIds()
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Database className="h-5 w-5" />
          Fix Missing Lead Source IDs
        </CardTitle>
        <CardDescription>
          Update leads with missing lead_source_id values by matching their lead_source text with entries in the
          lead_sources table.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This utility will scan for leads that have a lead source name but no corresponding ID. It will automatically
            match the text values with lead sources in the database and update the records.
          </p>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {result.success ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <XCircle className="h-4 w-4 mt-0.5" />}
                <div>
                  <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>

                  {result.updatedLeads && result.updatedLeads.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-sm">Updated leads:</p>
                      <div className="mt-1 max-h-32 overflow-y-auto text-xs bg-gray-50 rounded p-2">
                        {result.updatedLeads.map((lead, index) => (
                          <div key={index} className="py-0.5">
                            {lead}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleFix} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Fix Missing Lead Source IDs
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
