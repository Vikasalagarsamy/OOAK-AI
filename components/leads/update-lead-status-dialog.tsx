"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { updateLeadStatus } from "@/actions/lead-actions"

interface UpdateLeadStatusDialogProps {
  lead: {
    id: number
    lead_number: string
    client_name: string
    status: string
    company_id: number
    company_name?: string
    branch_id?: number | null
    branch_name?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdated: () => void
}

export function UpdateLeadStatusDialog({ lead, open, onOpenChange, onStatusUpdated }: UpdateLeadStatusDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!status) {
      toast({
        title: "Status required",
        description: "Please select a status for the lead",
        variant: "destructive",
      })
      return
    }

    // Require rejection reason if status is REJECTED
    if (status === "REJECTED" && (!notes || notes.trim().length < 10)) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a detailed reason for rejecting this lead (minimum 10 characters)",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateLeadStatus(lead.id, status, notes)

      if (result.success) {
        toast({
          title: "Status updated",
          description: `Lead status has been updated to ${status}`,
        })

        // Close the dialog
        onOpenChange(false)

        // If status is REJECTED, redirect to Rejected Leads page
        if (status === "REJECTED") {
          // Show a toast notification that the lead has been rejected
          toast({
            title: "Lead rejected",
            description: "The lead has been moved to the Rejected Leads page and is now available for reassignment",
          })

          // Force a refresh of the parent component to remove the lead from the list
          onStatusUpdated()

          // Redirect to Rejected Leads page after a short delay
          setTimeout(() => {
            router.push("/sales/rejected-leads")
          }, 500)
        } else {
          // For other status changes, just refresh the parent component
          onStatusUpdated()
        }
      } else {
        toast({
          title: "Update failed",
          description: result.message || "Failed to update lead status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating lead status:", error)
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Lead Status</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="lead-info">Lead</Label>
            <div id="lead-info" className="text-sm font-medium">
              {lead.lead_number} - {lead.client_name}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="PROPOSAL">Proposal</SelectItem>
                <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {status === "REJECTED" && (
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Marking as rejected will remove this lead from your list and move it to the Rejected Leads page.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes" className="flex items-center gap-1">
              {status === "REJECTED" ? (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Rejection Reason (Required)</span>
                </>
              ) : (
                "Notes (Optional)"
              )}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                status === "REJECTED"
                  ? "Please provide a detailed reason for rejecting this lead"
                  : "Add any relevant notes about this status change"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={status === "REJECTED" && notes.length < 10 ? "border-red-300" : ""}
            />
            {status === "REJECTED" && notes.length < 10 && (
              <p className="text-xs text-red-500">
                Please provide a detailed reason for rejection (minimum 10 characters)
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || (status === "REJECTED" && notes.length < 10)}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
