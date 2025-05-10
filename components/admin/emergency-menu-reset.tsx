"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function EmergencyMenuReset() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  async function resetMenuSystem() {
    if (!confirm("This will reset the menu system and force a refresh. Continue?")) {
      return
    }

    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/reset-menu-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset menu system")
      }

      setResult({
        success: true,
        message: data.message || "Menu system reset successfully",
      })

      toast({
        title: "Menu system reset",
        description: "The menu system has been reset successfully. Please refresh the page.",
        variant: "default",
      })

      // Force reload after 2 seconds
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred while resetting the menu system",
      })

      toast({
        title: "Reset failed",
        description: error.message || "An error occurred while resetting the menu system",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Menu System Reset</CardTitle>
        <CardDescription>
          Use this tool only when the menu system is not working correctly and other fixes have failed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">This tool will perform the following actions:</p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Reset all menu permissions for the Administrator role</li>
          <li>Ensure all menu items are properly visible</li>
          <li>Fix parent-child relationships in the menu structure</li>
          <li>Clear any cached menu data</li>
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
        <Button onClick={resetMenuSystem} disabled={loading} variant="destructive">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Resetting..." : "Emergency Reset Menu System"}
        </Button>
      </CardFooter>
    </Card>
  )
}
