"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { addEventCoordinationMenu } from "@/actions/add-event-coordination-menu"
import { useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AddEventCoordinationMenu() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  const handleAddMenu = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await addEventCoordinationMenu()
      setResult(response)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Add Event Co-ordination Menu</CardTitle>
        <CardDescription>
          Add a new Event Co-ordination main menu item with sub-menu items to the navigation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">The following menu items will be created:</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Event Co-ordination (Main Menu)</li>
              <li className="ml-4">Event Dashboard</li>
              <li className="ml-4">Event Calendar</li>
              <li className="ml-4">Create Event</li>
              <li className="ml-4">Event Types</li>
              <li className="ml-4">Event Reports</li>
            </ul>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.success
                  ? "Event Co-ordination menu has been added successfully."
                  : `Failed to add Event Co-ordination menu: ${result.error}`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAddMenu} disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Event Co-ordination Menu"}
        </Button>
      </CardFooter>
    </Card>
  )
}
