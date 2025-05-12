"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createSqlFunctions } from "@/actions/create-sql-functions"
import { createSqlFunctionsDirect } from "@/actions/create-sql-functions-direct"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function CreateSqlFunctions() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  const handleCreateFunctions = async () => {
    setIsLoading(true)
    try {
      // Try the first approach
      const result = await createSqlFunctions()

      // If the first approach fails, try the direct approach
      if (!result.success) {
        console.log("First approach failed, trying direct approach...")
        const directResult = await createSqlFunctionsDirect()
        setResult(directResult)
      } else {
        setResult(result)
      }
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create SQL Helper Functions</CardTitle>
        <CardDescription>Create SQL helper functions for database operations</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          This will create two SQL functions that are used for database operations:
        </p>
        <ul className="list-disc pl-5 mb-4 text-sm text-gray-500">
          <li>
            <code>exec_sql</code> - Executes SQL without returning results
          </li>
          <li>
            <code>exec_sql_with_result</code> - Executes SQL and returns results
          </li>
        </ul>
        {result && (
          <div
            className={`p-3 rounded-md mt-4 ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {result.success ? "SQL functions created successfully!" : `Error: ${result.error}`}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleCreateFunctions} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create SQL Functions"}
        </Button>
      </CardFooter>
    </Card>
  )
}
