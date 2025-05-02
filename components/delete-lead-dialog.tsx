"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { deleteLead } from "@/actions/lead-actions"

interface DeleteLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: number
  leadNumber: string
  clientName: string
  onDeleted: () => void
}

export function DeleteLeadDialog({
  open,
  onOpenChange,
  leadId,
  leadNumber,
  clientName,
  onDeleted,
}: DeleteLeadDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteLead(leadId)

      if (result.success) {
        toast({
          title: "Lead deleted",
          description: result.message,
        })
        onDeleted()
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
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
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
          <AlertDialogTitle>Are you sure you want to delete this lead?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete lead <strong>{leadNumber}</strong> for client <strong>{clientName}</strong>.
            <br />
            <br />
            This action cannot be undone. This will permanently delete the lead and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Lead"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
