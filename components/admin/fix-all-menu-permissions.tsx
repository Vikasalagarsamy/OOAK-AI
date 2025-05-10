"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { fixAllMenuPermissions } from "@/actions/fix-all-menu-permissions"

export function FixAllMenuPermissions() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFix = async () => {
    setIsLoading(true)
    try {
      const response = await fixAllMenuPermissions()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h2 className="text-xl font-bold">Fix All Menu Permissions</h2>
        <p className="text-muted-foreground">
          This will reset and fix all menu permissions for the Administrator role, ensuring all menu items are visible
          and accessible.
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <Button onClick={handleFix} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Fixing Permissions..." : "Fix All Menu Permissions"}
        </Button>

        <Button variant="outline" onClick={() => window.location.reload()} disabled={isLoading}>
          Reload Page
        </Button>
      </div>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <div className="border rounded-md p-4 bg-muted/50">
        <h3 className="font-medium mb-2">After fixing permissions:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click the "Reload Page" button</li>
          <li>Log out and log back in to refresh your session</li>
          <li>All menu items should now be visible and accessible</li>
        </ol>
      </div>
    </div>
  )
}
