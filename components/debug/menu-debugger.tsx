"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function MenuDebugger() {
  const [menuData, setMenuData] = useState<any>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchMenuData() {
    try {
      setLoading(true)
      setError(null)
      setErrorDetails(null)

      // Fetch menu data directly
      const response = await fetch("/api/menu", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorJson = null

        try {
          // Try to parse as JSON
          errorJson = JSON.parse(errorText)
        } catch (e) {
          // If not JSON, use the text as is
          console.error("Response is not JSON:", errorText)
        }

        throw new Error(
          `API returned status ${response.status}${errorJson ? `: ${errorJson.message || errorJson.error}` : ""}`,
        )
      }

      const data = await response.json()
      setMenuData(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch menu data")
      console.error("Menu debug error:", err)

      // Try to extract more details if available
      if (err.response) {
        try {
          const details = await err.response.json()
          setErrorDetails(details)
        } catch (e) {
          console.error("Could not parse error details:", e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function testAuthStatus() {
    try {
      setLoading(true)
      const response = await fetch("/api/auth/status", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      const data = await response.json()
      setMenuData({ authStatus: data })
    } catch (err: any) {
      setError(`Auth check failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Menu Debugger</CardTitle>
        <CardDescription>Diagnose menu loading issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={fetchMenuData} disabled={loading} variant="outline">
              {loading ? "Loading..." : "Fetch Menu Data"}
            </Button>

            <Button onClick={testAuthStatus} disabled={loading} variant="outline">
              Test Auth Status
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error}</p>
                {errorDetails && (
                  <div className="mt-2 text-xs">
                    <pre className="bg-gray-800 text-white p-2 rounded overflow-auto">
                      {JSON.stringify(errorDetails, null, 2)}
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {menuData && (
            <div className="space-y-4">
              <h3 className="font-bold">
                {menuData.authStatus ? "Auth Status" : `Menu Items: ${Array.isArray(menuData) ? menuData.length : 0}`}
              </h3>

              <div className="overflow-auto max-h-96 border rounded-md p-4">
                <pre className="text-xs">{JSON.stringify(menuData, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-bold">Troubleshooting Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Check if menu data is being returned from the API</li>
              <li>Verify that the user has the correct role (Administrator)</li>
              <li>Ensure menu items exist in the database</li>
              <li>Check if permissions are correctly assigned</li>
              <li>Inspect browser console for JavaScript errors</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
