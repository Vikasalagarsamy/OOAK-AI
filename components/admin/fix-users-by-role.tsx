"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { createGetUsersByRoleFunction } from "@/actions/create-users-by-role-function"
import { useToast } from "@/components/ui/use-toast"

export function FixUsersByRole() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)
  const { toast } = useToast()

  const handleFix = async () => {
    setIsLoading(true)
    try {
      const result = await createGetUsersByRoleFunction()
      setResult(result)

      if (result.success) {
        toast({
          title: "Success",
          description: "The get_users_by_role function has been created successfully.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create the function.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fixing users by role:", error)
      setResult({ success: false, error: "An unexpected error occurred." })
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the function.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>
            {result.success
              ? "The get_users_by_role function has been created successfully. Please refresh the page to see the users by role."
              : `Failed to create the function: ${result.error}`}
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={handleFix} disabled={isLoading}>
        {isLoading ? "Creating Function..." : "Fix Users by Role Function"}
      </Button>
    </div>
  )
}
