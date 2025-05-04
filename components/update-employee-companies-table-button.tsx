"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateEmployeeCompaniesTable } from "@/actions/update-employee-companies-table"
import { toast } from "@/components/ui/use-toast"

export function UpdateEmployeeCompaniesTableButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await updateEmployeeCompaniesTable()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating employee companies table:", error)
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
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Updating..." : "Update Employee Companies Table"}
    </Button>
  )
}
