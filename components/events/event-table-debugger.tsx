"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createColumnInfoFunction, getEventsTableInfo, testInsertShortId } from "@/actions/debug-event-table"

export default function EventTableDebugger() {
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGetTableInfo = async () => {
    setIsLoading(true)
    try {
      await createColumnInfoFunction()
      const info = await getEventsTableInfo()
      setTableInfo(info)
    } catch (error) {
      console.error("Error getting table info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestInsert = async () => {
    setIsLoading(true)
    try {
      const result = await testInsertShortId()
      setTestResult(result)
    } catch (error) {
      console.error("Error testing insert:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Events Table Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={handleGetTableInfo} disabled={isLoading}>
              Get Table Information
            </Button>
            <Button onClick={handleTestInsert} disabled={isLoading}>
              Test Insert Short ID
            </Button>
          </div>

          {tableInfo && (
            <div>
              <h3 className="font-semibold mb-2">Table Information</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">{JSON.stringify(tableInfo, null, 2)}</pre>
            </div>
          )}

          {testResult && (
            <div>
              <h3 className="font-semibold mb-2">Test Insert Result</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
