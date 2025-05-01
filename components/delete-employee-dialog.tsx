"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteEmployee } from "@/actions/employee-actions"
import type { Employee } from "@/types/employee"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, Loader2 } from "lucide-react"

interface DeleteEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onDelete?: (employeeId: string) => void
}

export function DeleteEmployeeDialog({ open, onOpenChange, employee, onDelete }: DeleteEmployeeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!employee) return

    setIsDeleting(true)

    try {
      // Call the server action - this may redirect, which will navigate away from this page
      await deleteEmployee(employee.id.toString())

      // If we get here (no redirect occurred), update the UI
      if (onDelete) {
        onDelete(employee.id.toString())
      }

      // Show success toast
      toast({
        title: "Employee deleted",
        description: `${employee.first_name} ${employee.last_name} has been successfully removed.`,
      })

      // Close the dialog
      onOpenChange(false)
    } catch (error) {
      // Check if this is a redirect error (we shouldn't actually catch these)
      if (error instanceof Error && error.message === "NEXT_REDIRECT") {
        // Let the redirect happen naturally
        return
      }

      // For all other errors, show an error message
      console.error("Error deleting employee:", error)
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })

      // Reset the deleting state
      setIsDeleting(false)
    }
  }

  if (!employee) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Prevent closing the dialog while deletion is in progress
        if (isDeleting && !newOpen) return
        onOpenChange(newOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Employee</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete {employee.first_name} {employee.last_name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
