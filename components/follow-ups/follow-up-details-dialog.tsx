"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Video,
  Users,
  MessageSquare,
  Globe,
  HelpCircle,
  CheckCircle,
  Edit,
  Trash2,
  User,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
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

import { updateFollowUpStatus, deleteFollowUp } from "@/actions/follow-up-actions"
import type { FollowUpWithLead } from "@/types/follow-up"

const followupTypeIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  in_person: <Users className="h-4 w-4" />,
  video_call: <Video className="h-4 w-4" />,
  text_message: <MessageSquare className="h-4 w-4" />,
  social_media: <Globe className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  missed: "bg-red-100 text-red-800",
  rescheduled: "bg-purple-100 text-purple-800",
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

interface FollowUpDetailsDialogProps {
  followUp: FollowUpWithLead
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: () => void
}

export function FollowUpDetailsDialog({ followUp, open, onOpenChange, onStatusChange }: FollowUpDetailsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [outcome, setOutcome] = useState("")
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  async function handleComplete() {
    if (!outcome.trim()) {
      toast({
        variant: "destructive",
        title: "Outcome required",
        description: "Please provide an outcome for this follow-up",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateFollowUpStatus(followUp.id, "completed", {
        completed_at: new Date().toISOString(),
        outcome: outcome,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Follow-up marked as completed",
        })
        setShowCompleteDialog(false)
        onStatusChange()
        onOpenChange(false)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to update follow-up",
        })
      }
    } catch (error) {
      console.error("Error completing follow-up:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    setIsSubmitting(true)

    try {
      const result = await deleteFollowUp(followUp.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Follow-up deleted successfully",
        })
        setShowDeleteDialog(false)
        onStatusChange()
        onOpenChange(false)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to delete follow-up",
        })
      }
    } catch (error) {
      console.error("Error deleting follow-up:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Follow-up Details</DialogTitle>
            <DialogDescription>View and manage follow-up information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-medium text-lg">{followUp.lead?.client_name || "Unknown Client"}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Lead #{followUp.lead?.lead_number || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={statusColors[followUp.status]}>
                  {followUp.status.charAt(0).toUpperCase() + followUp.status.slice(1)}
                </Badge>

                <Badge className={priorityColors[followUp.priority]}>
                  {followUp.priority.charAt(0).toUpperCase() + followUp.priority.slice(1)} Priority
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Scheduled Date & Time</h4>
                <div className="flex items-center text-sm">
                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span className="mr-3">{format(new Date(followUp.scheduled_at), "MMMM d, yyyy")}</span>

                  <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(followUp.scheduled_at), "h:mm a")}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Follow-up Type</h4>
                <div className="flex items-center text-sm">
                  {followupTypeIcons[followUp.followup_type] || <HelpCircle className="mr-1 h-4 w-4" />}
                  <span className="ml-1 capitalize">{followUp.followup_type.replace(/_/g, " ")}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Created</h4>
                <div className="flex items-center text-sm">
                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(followUp.created_at), "MMMM d, yyyy")}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Created By</h4>
                <div className="flex items-center text-sm">
                  <User className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{followUp.created_by || "System"}</span>
                </div>
              </div>
            </div>

            {followUp.interaction_summary && (
              <div>
                <h4 className="text-sm font-medium mb-1">Summary</h4>
                <p className="text-sm">{followUp.interaction_summary}</p>
              </div>
            )}

            {followUp.notes && (
              <div>
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm">{followUp.notes}</p>
              </div>
            )}

            {followUp.outcome && (
              <div>
                <h4 className="text-sm font-medium mb-1">Outcome</h4>
                <p className="text-sm">{followUp.outcome}</p>
              </div>
            )}

            {followUp.completed_at && (
              <div>
                <h4 className="text-sm font-medium mb-1">Completed On</h4>
                <div className="flex items-center text-sm">
                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(followUp.completed_at), "MMMM d, yyyy")}</span>

                  <Clock className="ml-3 mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(followUp.completed_at), "h:mm a")}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {followUp.status === "scheduled" && (
              <>
                <Button variant="outline" onClick={() => setShowCompleteDialog(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>

                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </>
            )}

            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Follow-up Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Follow-up</DialogTitle>
            <DialogDescription>Record the outcome of this follow-up</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Outcome</h4>
              <Textarea
                placeholder="Describe the result of this follow-up"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isSubmitting || !outcome.trim()}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Saving...
                </>
              ) : (
                "Complete Follow-up"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this follow-up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
