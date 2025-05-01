"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import type { Client } from "@/types/client"
import { logActivity } from "@/services/activity-service"

interface BatchDeleteClientsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedClients: Client[]
  onClientsDeleted: () => void
}

export function BatchDeleteClientsDialog({
  open,
  onOpenChange,
  selectedClients,
  onClientsDeleted,
}: BatchDeleteClientsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ success: string[]; failed: string[] } | null>(null)
  const { toast } = useToast()

  const handleBatchDelete = async () => {
    if (selectedClients.length === 0) return

    setLoading(true)
    setResults(null)

    const successfulDeletes: string[] = []
    const failedDeletes: string[] = []

    try {
      // Process deletions one by one to track success/failure
      for (const client of selectedClients) {
        try {
          const { error } = await supabase.from("clients").delete().eq("id", client.id)

          if (error) {
            throw error
          }

          // Log the activity for each successful deletion
          await logActivity({
            actionType: "delete",
            entityType: "client",
            entityId: client.id.toString(),
            entityName: client.name,
            description: `Client ${client.name} (${client.client_code}) was deleted in batch operation`,
            userName: "Current User", // Replace with actual user name when available
          })

          successfulDeletes.push(`${client.name} (${client.client_code})`)
        } catch (error) {
          console.error(`Error deleting client ${client.id}:`, error)
          failedDeletes.push(`${client.name} (${client.client_code})`)
        }
      }

      // Set results for display
      setResults({
        success: successfulDeletes,
        failed: failedDeletes,
      })

      // Show toast with summary
      if (successfulDeletes.length > 0 && failedDeletes.length === 0) {
        toast({
          title: "Success",
          description: `Successfully deleted ${successfulDeletes.length} clients`,
        })

        // Call the callback to update the parent component
        onClientsDeleted()

        // Close the dialog after a short delay
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      } else if (successfulDeletes.length > 0 && failedDeletes.length > 0) {
        toast({
          title: "Partial Success",
          description: `Deleted ${successfulDeletes.length} clients, but failed to delete ${failedDeletes.length} clients`,
          variant: "destructive",
        })

        // Call the callback to update the parent component for the successful deletes
        onClientsDeleted()
      } else {
        toast({
          title: "Error",
          description: `Failed to delete all ${failedDeletes.length} clients`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in batch delete operation:", error)
      toast({
        title: "Error",
        description: `Error during batch delete operation: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Multiple Clients</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedClients.length} selected clients? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {results.success.length > 0 && (
              <div>
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                  Successfully deleted ({results.success.length}):
                </h4>
                <ul className="text-sm space-y-1 pl-5 list-disc">
                  {results.success.map((name, i) => (
                    <li key={`success-${i}`}>{name}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.failed.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                  Failed to delete ({results.failed.length}):
                </h4>
                <ul className="text-sm space-y-1 pl-5 list-disc">
                  {results.failed.map((name, i) => (
                    <li key={`failed-${i}`}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">You are about to delete the following clients:</p>
            <ul className="mt-2 max-h-[200px] overflow-y-auto text-sm pl-5 list-disc">
              {selectedClients.map((client) => (
                <li key={client.id}>
                  {client.name} ({client.client_code})
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button variant="destructive" onClick={handleBatchDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete All"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
