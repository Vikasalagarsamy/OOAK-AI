"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { updateLeadStatus } from "@/actions/lead-actions"
import { ReassignRejectedLeadModal } from "./reassign-rejected-lead-modal"

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
  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)

  const handleSubmit = async () => {
    if (!status) {
      toast({
        title: "Status required",
        description: "Please select a status for the lead",
        variant: "destructive",
      })
      return
    }

    // If status is REJECTED, show the reassignment modal
    if (status === "REJECTED") {
      setShowReassignModal(true)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateLeadStatus(lead.id, status, notes)

      if (result.success) {
        toast({
          title: "Status updated",
          description: `Lead ${lead.lead_number} status updated to ${status}`,
        })
        onStatusUpdated()
        onOpenChange(false)
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

  const handleReassignComplete = () => {
    onStatusUpdated()
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lead-number">Lead</Label>
              <div id="lead-number" className="text-sm font-medium">
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
                <p className="text-xs text-yellow-600">
                  Marking as rejected will prompt you to reassign this lead to a different company.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this status change"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassignment Modal */}
      {showReassignModal && (
        <ReassignRejectedLeadModal
          lead={lead}
          open={showReassignModal}
          onOpenChange={setShowReassignModal}
          onReassignComplete={handleReassignComplete}
        />
      )}
    </>
  )
}
