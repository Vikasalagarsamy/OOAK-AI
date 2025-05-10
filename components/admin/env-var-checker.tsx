"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function EnvVarChecker() {
  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkEnvVars = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/check-env-vars")

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setEnvVars(data.envVars)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables Checker</CardTitle>
        <CardDescription>Check which environment variables are available to the application</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={checkEnvVars} disabled={loading} className="mb-4">
          {loading ? "Checking..." : "Check Environment Variables"}
        </Button>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 mb-4">{error}</div>}

        {Object.keys(envVars).length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Variable</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(envVars).map(([key, value]) => (
                  <tr key={key} className="border-t">
                    <td className="px-4 py-2 font-mono text-sm">{key}</td>
                    <td className="px-4 py-2">
                      {value ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
