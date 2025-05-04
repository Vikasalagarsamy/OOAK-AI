"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { updateEmployeeCompaniesConstraint } from "@/actions/update-employee-companies-constraint"
import { Loader2 } from "lucide-react"

export function UpdateConstraintsButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await updateEmployeeCompaniesConstraint()

      if (result.success) {
        toast({
          title: "Success",
          description: "Database constraints updated successfully.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update database constraints.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating constraints:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
        </>
      ) : (
        "Update Database Constraints"
      )}
    </Button>
  )
}
