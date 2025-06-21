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
import { deleteClient } from "@/actions/client-actions"
import type { Client } from "@/types/client"

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
      console.log(`🗑️ [UI] Deleting client ${client.name} via server action...`)

      const result = await deleteClient(client.id)

      if (result.success) {
        console.log(`✅ [UI] Client ${client.name} deleted successfully`)
        
        toast({
          title: "Success",
          description: result.message,
        })

        // Call the onClientDeleted callback with the client id
        onClientDeleted(client.id)

        // Close the dialog
        onOpenChange(false)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("❌ [UI] Error deleting client:", error)
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
