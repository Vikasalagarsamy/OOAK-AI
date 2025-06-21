"use client"

import { useState } from "react"
import { deleteSupplier } from "@/actions/supplier-actions"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { Supplier } from "@/types/supplier"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface DeleteSupplierDialogProps {
  supplier: Supplier
  open: boolean
  onOpenChange: (open: boolean) => void
  onSupplierDeleted: () => void
}

export function DeleteSupplierDialog({ supplier, open, onOpenChange, onSupplierDeleted }: DeleteSupplierDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { user } = useCurrentUser()

  const handleDelete = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to delete suppliers.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    
    try {
      console.log(`🗑️ Deleting supplier: ${supplier.name} (ID: ${supplier.id})`)
      
      const result = await deleteSupplier(supplier.id, user)

      if (result.success) {
        console.log(`✅ Successfully deleted supplier: ${supplier.name}`)
        
        toast({
          title: "Supplier Deleted",
          description: `${supplier.name} has been successfully deleted.`,
          variant: "default",
        })

        // Call the parent callback to refresh the list
        onSupplierDeleted()
        
        // Close the dialog
        onOpenChange(false)
        
      } else {
        console.error(`❌ Failed to delete supplier: ${result.error}`)
        
        toast({
          title: "Deletion Failed",
          description: result.error || "Failed to delete supplier. Please try again.",
          variant: "destructive",
        })
      }

    } catch (error: any) {
      console.error("❌ Unexpected error deleting supplier:", error)
      
      toast({
        title: "Unexpected Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>🗑️ Delete Supplier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete the supplier{" "}
            <strong className="font-semibold text-foreground">{supplier.name}</strong>
            {supplier.supplier_code && (
              <>
                {" "}(<span className="font-mono text-sm">{supplier.supplier_code}</span>)
              </>
            )}
            ?
            <br />
            <br />
            <span className="text-destructive font-medium">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Deleting...
              </>
            ) : (
              <>
                🗑️ Delete Supplier
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
