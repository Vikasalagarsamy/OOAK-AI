"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("vendors").delete().eq("id", vendor.id)

      if (error) {
        throw error
      }

      onVendorDeleted()
    } catch (error: any) {
      console.error("Error deleting vendor:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete vendor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the vendor <strong>{vendor.name}</strong> ({vendor.vendor_code}). This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
