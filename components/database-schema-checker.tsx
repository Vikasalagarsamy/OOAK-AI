"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { checkLeadSourceColumnExists } from "@/actions/check-database-schema"
import { Loader2, Database, Check, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DatabaseSchemaChecker() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    exists: boolean
    details?: any
    allColumns?: any[]
    error?: string
  } | null>(null)

  const checkSchema = async () => {
    setLoading(true)
    try {
      const schemaResult = await checkLeadSourceColumnExists()
      setResult(schemaResult)
    } catch (error) {
      console.error("Error checking schema:", error)
      setResult({
        exists: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Schema Checker
        </CardTitle>
        <CardDescription>Check if the lead_source column exists in the leads table</CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-4">
            <Alert variant={result.exists ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {result.exists ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                <AlertTitle>{result.exists ? "Column Exists" : "Column Missing"}</AlertTitle>
              </div>
              <AlertDescription>
                {result.exists
                  ? "The lead_source column exists in the leads table."
                  : "The lead_source column does NOT exist in the leads table."}
              </AlertDescription>
            </Alert>

            {result.error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}

            {result.details && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Column Details:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}

            {result.allColumns && result.allColumns.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">All Columns in Leads Table:</h3>
                <div className="overflow-auto max-h-60">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Column Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Data Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.allColumns.map((column, index) => (
                        <tr key={index} className={column.column_name === "lead_source" ? "bg-green-50" : ""}>
                          <td className="px-3 py-2 whitespace-nowrap">{column.column_name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{column.data_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkSchema} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Database Schema"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
