"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ensureLeadSourcesTable } from "@/actions/ensure-lead-sources-table"

export function EnsureLeadSourcesTable() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)

  const handleEnsureTable = async () => {
    setLoading(true)
    try {
      const result = await ensureLeadSourcesTable()
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleEnsureTable} disabled={loading}>
        {loading ? "Creating Table..." : "Ensure Lead Sources Table Exists"}
      </Button>
    </div>
  )
}
