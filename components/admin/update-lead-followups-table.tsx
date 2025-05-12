"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { updateLeadFollowupsTable } from "@/actions/update-lead-followups-table"
import { updateLeadFollowupsTableAlternative } from "@/actions/update-lead-followups-table-alternative"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fixLeadFollowups } from "@/actions/fix-lead-followups"

export function UpdateLeadFollowupsTable() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      // Try the primary method first
      let result = await updateLeadFollowupsTable()

      // If the primary method fails, try the alternative method
      if (!result.success) {
        console.log("Primary method failed, trying alternative method...")
        result = await updateLeadFollowupsTableAlternative()
      }

      setResult(result)
      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error updating lead_followups table:", error)
      setResult({
        success: false,
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the lead_followups table",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Lead Followups Table</CardTitle>
        <CardDescription>
          Update the lead_followups table to make the created_by field nullable and change its type to TEXT
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This will modify the lead_followups table to fix issues with the created_by field. This is useful if you're
          experiencing UUID format errors when scheduling follow-ups.
        </p>
        {result && (
          <div
            className={`mt-4 p-3 rounded-md ${
              result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            <p className="text-sm font-medium">{result.success ? "Success" : "Error"}</p>
            <p className="text-sm">{result.message}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleUpdate} disabled={isUpdating}>
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUpdating ? "Updating..." : "Update Table"}
        </Button>
        <Button
          onClick={async () => {
            setIsUpdating(true)
            try {
              const result = await fixLeadFollowups()
              setResult(result)
              toast({
                title: result.success ? "Success" : "Error",
                description: result.message,
                variant: result.success ? "default" : "destructive",
              })
            } catch (error) {
              console.error("Error fixing lead followups:", error)
              setResult({
                success: false,
                message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
              })
              toast({
                title: "Error",
                description: "An unexpected error occurred while fixing lead followups",
                variant: "destructive",
              })
            } finally {
              setIsUpdating(false)
            }
          }}
          variant="outline"
          disabled={isUpdating}
        >
          Create Helper Function
        </Button>
      </CardFooter>
    </Card>
  )
}
