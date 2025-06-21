"use client"

import { useState } from "react"
import { deleteVendor } from "@/actions/vendor-actions"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { Vendor } from "@/types/vendor"
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

interface DeleteVendorDialogProps {
  vendor: Vendor
  open: boolean
  onOpenChange: (open: boolean) => void
  onVendorDeleted: () => void
}

export function DeleteVendorDialog({ vendor, open, onOpenChange, onVendorDeleted }: DeleteVendorDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { user } = useCurrentUser()

  const handleDelete = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to delete vendors.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    
    try {
      console.log(`🗑️ Deleting vendor: ${vendor.name} (ID: ${vendor.id})`)
      
      const result = await deleteVendor(vendor.id, user)

      if (result.success) {
        console.log(`✅ Successfully deleted vendor: ${vendor.name}`)
        
        toast({
          title: "Vendor Deleted",
          description: `${vendor.name} has been successfully deleted.`,
          variant: "default",
        })

        // Call the parent callback to refresh the list
        onVendorDeleted()
        
        // Close the dialog
        onOpenChange(false)
        
      } else {
        console.error(`❌ Failed to delete vendor: ${result.error}`)
        
        toast({
          title: "Deletion Failed",
          description: result.error || "Failed to delete vendor. Please try again.",
          variant: "destructive",
        })
      }

    } catch (error: any) {
      console.error("❌ Unexpected error deleting vendor:", error)
      
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
          <AlertDialogTitle>🗑️ Delete Vendor</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete the vendor{" "}
            <strong className="font-semibold text-foreground">{vendor.name}</strong>
            {vendor.vendor_code && (
              <>
                {" "}(<span className="font-mono text-sm">{vendor.vendor_code}</span>)
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
                🗑️ Delete Vendor
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
