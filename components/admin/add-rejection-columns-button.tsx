"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { addRejectionColumnsToLeads } from "@/actions/add-rejection-columns"

export function AddRejectionColumnsButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAddColumns = async () => {
    setIsLoading(true)
    try {
      const result = await addRejectionColumnsToLeads()

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
      console.error("Error adding rejection columns:", error)
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
    <Button onClick={handleAddColumns} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Add Rejection Columns to Leads Table
    </Button>
  )
}
