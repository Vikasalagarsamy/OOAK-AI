"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { scheduleLeadFollowup } from "@/actions/lead-actions"

interface ScheduleFollowupDialogProps {
  lead: {
    id: number
    lead_number: string
    client_name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onFollowupScheduled?: () => void
}

export function ScheduleFollowupDialog({ lead, open, onOpenChange, onFollowupScheduled }: ScheduleFollowupDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("09:00")
  const [followupType, setFollowupType] = useState("call")
  const [notes, setNotes] = useState("")
  const [priority, setPriority] = useState("medium")
  const [summary, setSummary] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for the follow-up",
        variant: "destructive",
      })
      return
    }

    if (!followupType) {
      toast({
        title: "Follow-up type required",
        description: "Please select a type for the follow-up",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Combine date and time
      const scheduledDate = new Date(date)
      const [hours, minutes] = time.split(":").map(Number)
      scheduledDate.setHours(hours, minutes, 0, 0)

      // Format as ISO string for the database
      const scheduledAt = scheduledDate.toISOString()

      // Call the server action
      const result = await scheduleLeadFollowup({
        leadId: lead.id,
        scheduledAt,
        followupType,
        notes,
        priority,
        summary,
      })

      if (result.success) {
        toast({
          title: "Follow-up scheduled",
          description: `Follow-up scheduled for ${format(scheduledDate, "PPP")} at ${format(scheduledDate, "p")}`,
        })

        // Close the dialog
        onOpenChange(false)

        // Notify parent component
        if (onFollowupScheduled) {
          onFollowupScheduled()
        }
      } else {
        setError(result.message || "Failed to schedule follow-up")
        toast({
          title: "Error",
          description: result.message || "Failed to schedule follow-up",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error scheduling follow-up:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
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
          <DialogTitle>Schedule Follow-up</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="lead-info">Lead</Label>
            <div id="lead-info" className="text-sm font-medium">
              {lead.lead_number} - {lead.client_name}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="11:00">11:00 AM</SelectItem>
                <SelectItem value="12:00">12:00 PM</SelectItem>
                <SelectItem value="13:00">1:00 PM</SelectItem>
                <SelectItem value="14:00">2:00 PM</SelectItem>
                <SelectItem value="15:00">3:00 PM</SelectItem>
                <SelectItem value="16:00">4:00 PM</SelectItem>
                <SelectItem value="17:00">5:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="followup-type">Follow-up Type</Label>
            <Select value={followupType} onValueChange={setFollowupType}>
              <SelectTrigger id="followup-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="site-visit">Site Visit</SelectItem>
                <SelectItem value="demo">Product Demo</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="summary">Interaction Summary (Optional)</Label>
            <Textarea
              id="summary"
              placeholder="Brief summary of previous interaction"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes for this follow-up"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Follow-up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
