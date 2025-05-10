"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Database } from "lucide-react"
import { ensureUserAccountsTable } from "@/actions/ensure-user-accounts-table"

export function EnsureUserAccountsTableButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await ensureUserAccountsTable()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "User accounts table checked and created if needed.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to ensure user accounts table exists.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error ensuring user accounts table:", error)
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
    <Button onClick={handleClick} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking...
        </>
      ) : (
        <>
          <Database className="mr-2 h-4 w-4" />
          Ensure User Accounts Table
        </>
      )}
    </Button>
  )
}
