"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface VerificationResult {
  success: boolean
  message: string
  details: Record<string, { exists: boolean; message: string; error?: string }>
}

export function VerifyDatabaseTables({
  onVerify,
}: {
  onVerify: () => Promise<VerificationResult>
}) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const verificationResult = await onVerify()
      setResult(verificationResult)

      if (verificationResult.success) {
        toast({
          title: "Verification Successful",
          description: "All required database tables are available.",
        })
      } else {
        toast({
          title: "Verification Issues",
          description: "Some tables could not be verified. See details below.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying database tables:", error)
      toast({
        title: "Verification Failed",
        description: "An unexpected error occurred during verification.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Table Verification</CardTitle>
          <CardDescription>Verify and create required database tables for the application</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Database Tables"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Results</CardTitle>
            <CardDescription>
              {result.success ? "All required tables are available" : "Some tables could not be verified"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(result.details).map(([tableName, tableResult]) => (
                <div key={tableName} className="flex items-start space-x-3 p-3 border rounded-md">
                  <div className="flex-shrink-0 mt-0.5">
                    {tableResult.exists ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : tableResult.error ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{tableName}</h3>
                    <p className="text-sm text-gray-500">{tableResult.message}</p>
                    {tableResult.error && <p className="text-sm text-red-500 mt-1">Error: {tableResult.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
