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

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client
  onClientDeleted: (id: number) => void
}

export function DeleteClientDialog({ open, onOpenChange, client, onClientDeleted }: DeleteClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)

    try {
      const { error } = await supabase.from("clients").delete().eq("id", client.id)

      if (error) {
        throw error
      }

      // Log the activity
      await logActivity({
        actionType: "delete",
        entityType: "client",
        entityId: client.id.toString(),
        entityName: client.name,
        description: `Client ${client.name} (${client.client_code}) was deleted`,
        userName: "Current User", // Replace with actual user name when available
      })

      toast({
        title: "Success",
        description: "Client deleted successfully",
      })

      // Call the onClientDeleted callback with the client id
      onClientDeleted(client.id)

      // Close the dialog
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: `Error deleting client: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the client "{client.name}" ({client.client_code})? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
