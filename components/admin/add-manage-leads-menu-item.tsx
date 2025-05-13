"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addManageLeadsMenuItem } from "@/actions/add-manage-leads-menu-item"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AddManageLeadsMenuItem() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  const handleAddMenuItem = async () => {
    setIsLoading(true)
    try {
      const result = await addManageLeadsMenuItem()
      setResult(result)

      if (result.success) {
        toast({
          title: "Success",
          description: "Manage Leads menu item added successfully. Please refresh the page to see changes.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add Manage Leads menu item",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding menu item:", error)
      setResult({ success: false, error: String(error) })
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Manage Leads Menu Item</CardTitle>
        <CardDescription>Add the "Manage Leads" menu item to the Sales menu and configure permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              {result.success
                ? "Manage Leads menu item added successfully. Please refresh the page to see changes."
                : result.error || "Failed to add Manage Leads menu item"}
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleAddMenuItem} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Manage Leads Menu Item"
          )}
        </Button>

        {result?.success && (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
