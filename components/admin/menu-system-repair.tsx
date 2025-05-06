"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export function MenuSystemRepair() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  async function repairMenuSystem() {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/menu-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repair: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to repair menu system")
      }

      setResult({
        success: true,
        message: data.message || "Menu system repaired successfully",
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred while repairing the menu system",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu System Repair</CardTitle>
        <CardDescription>Fix issues with the menu system by recreating necessary database entries</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">This tool will check and repair the menu system by:</p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Ensuring all required menu tables exist</li>
          <li>Creating default menu items if none exist</li>
          <li>Setting up proper permissions for the Administrator role</li>
          <li>Fixing any inconsistencies in the menu data</li>
        </ul>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={repairMenuSystem} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Repairing..." : "Repair Menu System"}
        </Button>
      </CardFooter>
    </Card>
  )
}
