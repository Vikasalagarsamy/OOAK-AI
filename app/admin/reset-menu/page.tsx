"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { resetMenuSystem } from "@/actions/menu-reset-actions"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, AlertTriangle } from "lucide-react"

export default function ResetMenuPage() {
  const [isResetting, setIsResetting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the entire menu system? This will affect all users.")) {
      return
    }

    setIsResetting(true)
    try {
      const result = await resetMenuSystem()
      setResult(result)

      if (result.success) {
        toast({
          title: "Menu Reset Successful",
          description: `Reset ${result.itemsCount} menu items. Please reload the page.`,
        })
      } else {
        toast({
          title: "Menu Reset Failed",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during menu reset:", error)
      toast({
        title: "Menu Reset Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Reset Menu System</h1>

      <Card>
        <CardHeader>
          <CardTitle>Menu System Reset</CardTitle>
          <CardDescription>
            This will reset all menu visibility settings and ensure the Administrator role has full permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <p className="text-sm">
              Warning: This is a drastic action that will affect all users. Only use this if the menu system is broken
              and other fixes have failed.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleReset} disabled={isResetting} className="gap-1">
            {isResetting && <RefreshCw className="h-4 w-4 animate-spin" />}
            {isResetting ? "Resetting..." : "Reset Menu System"}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-2">Result</h2>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
