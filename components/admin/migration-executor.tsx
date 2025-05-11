"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Check, X, AlertTriangle, Database } from "lucide-react"
import { executeMigration, verifyRejectionColumns } from "@/actions/execute-migration"
import { useToast } from "@/components/ui/use-toast"

export function MigrationExecutor() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    details?: string[]
  } | null>(null)
  const [verificationResult, setVerificationResult] = useState<{
    success?: boolean
    message?: string
    columns?: { name: string; exists: boolean; type?: string }[]
  } | null>(null)

  const handleExecuteMigration = async () => {
    try {
      setLoading(true)
      setResult(null)

      const migrationResult = await executeMigration()
      setResult(migrationResult)

      toast({
        title: migrationResult.success ? "Migration Successful" : "Migration Failed",
        description: migrationResult.message,
        variant: migrationResult.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error executing migration:", error)
      setResult({
        success: false,
        message: "An unexpected error occurred",
        details: [error.toString()],
      })

      toast({
        title: "Error",
        description: "An unexpected error occurred while executing the migration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyColumns = async () => {
    try {
      setVerifying(true)
      setVerificationResult(null)

      const result = await verifyRejectionColumns()
      setVerificationResult(result)

      toast({
        title: result.success ? "Verification Successful" : "Verification Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error verifying columns:", error)
      setVerificationResult({
        success: false,
        message: "An unexpected error occurred during verification",
      })

      toast({
        title: "Error",
        description: "An unexpected error occurred during verification",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Migration for Rejection Reasons</CardTitle>
        <CardDescription>Add columns to the leads table to store rejection reasons, dates, and users</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleVerifyColumns}
            disabled={verifying}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Verify Columns</span>
              </>
            )}
          </Button>

          <Button
            onClick={handleExecuteMigration}
            disabled={loading}
            variant="default"
            className="flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Executing Migration...</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Execute Migration</span>
              </>
            )}
          </Button>
        </div>

        {verificationResult && (
          <Alert variant={verificationResult.success ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification Result</AlertTitle>
            <AlertDescription>
              {verificationResult.message}

              {verificationResult.columns && (
                <div className="mt-2 space-y-2">
                  {verificationResult.columns.map((column) => (
                    <div key={column.name} className="flex items-center gap-2">
                      {column.exists ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{column.name}:</span>
                      {column.exists ? (
                        <Badge variant="outline">{column.type || "unknown type"}</Badge>
                      ) : (
                        <Badge variant="destructive">missing</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Migration Result</AlertTitle>
            <AlertDescription>
              {result.message}

              {result.details && result.details.length > 0 && (
                <div className="mt-2">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">View Details</summary>
                    <div className="mt-2 max-h-60 overflow-y-auto rounded bg-muted p-2 text-sm">
                      {result.details.map((detail, index) => (
                        <div key={index} className="py-1">
                          {detail}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        <div className="text-sm text-muted-foreground">
          This migration adds the following columns to the leads table:
          <ul className="list-disc pl-4 mt-2">
            <li>rejection_reason: TEXT - Stores the reason why a lead was rejected</li>
            <li>rejected_at: TIMESTAMP WITH TIME ZONE - Records when the lead was rejected</li>
            <li>rejected_by: TEXT - Records who rejected the lead</li>
          </ul>
        </div>
      </CardFooter>
    </Card>
  )
}
