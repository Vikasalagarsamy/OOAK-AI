"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createEventsTable } from "@/actions/create-events-table"
import { useToast } from "@/components/ui/use-toast"
import { Database, Loader2 } from "lucide-react"

export function InitializeEventsTable() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleInitialize = async () => {
    setIsLoading(true)
    try {
      const result = await createEventsTable()

      if (result.success) {
        toast({
          title: "Success",
          description: "Events table has been created successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to create events table: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error initializing events table:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the events table.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-md border p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Database className="h-8 w-8 text-gray-500" />
        <div className="flex-1">
          <h3 className="text-lg font-medium">Initialize Events Table</h3>
          <p className="text-sm text-gray-500">Create the events table in the database to store event information.</p>
        </div>
        <Button onClick={handleInitialize} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : (
            "Initialize Table"
          )}
        </Button>
      </div>
    </div>
  )
}
