"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createExecSqlWithResultFunction } from "@/actions/create-exec-sql-with-result-function"
import { toast } from "@/components/ui/use-toast"

export function CreateExecSqlWithResultFunction() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await createExecSqlWithResultFunction()
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Create SQL Execution Function with Results</h2>
      <p className="text-muted-foreground">
        This will create a database function that can execute SQL queries and return results. This is needed for
        checking if tables exist without column ambiguity errors.
      </p>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Function"}
      </Button>
    </div>
  )
}
