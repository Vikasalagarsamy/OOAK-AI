"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Calendar, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { scheduleLeadFollowup } from "@/actions/lead-actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, addDays, addWeeks, addMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ScheduleFollowupDialogProps {
  lead: {
    id: number
    lead_number: string
    client_name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onFollowupScheduled: () => void
}

export function ScheduleFollowupDialog({ lead, open, onOpenChange, onFollowupScheduled }: ScheduleFollowupDialogProps) {
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("09:00")
  const [followupType, setFollowupType] = useState("call")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Quick date selection options
  const quickDateOptions = [
    { label: "Tomorrow", getValue: () => addDays(new Date(), 1) },
    { label: "Next Week", getValue: () => addWeeks(new Date(), 1) },
    { label: "Next Month", getValue: () => addMonths(new Date(), 1) },
  ]

  const handleSubmit = async () => {
    setError(null)

    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for the follow-up",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date and time
      const dateTime = new Date(date)
      const [hours, minutes] = time.split(":").map(Number)
      dateTime.setHours(hours, minutes)

      // Validate the date is in the future
      if (dateTime <= new Date()) {
        toast({
          title: "Invalid date/time",
          description: "Please select a future date and time for the follow-up",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      console.log("Scheduling follow-up with data:", {
        leadId: lead.id,
        dateTime: dateTime.toISOString(),
        followupType,
        notes,
      })

      const result = await scheduleLeadFollowup(lead.id, dateTime.toISOString(), followupType, notes)

      if (result.success) {
        toast({
          title: "Follow-up scheduled",
          description: `Follow-up scheduled for ${format(dateTime, "PPP")} at ${format(dateTime, "p")}`,
        })
        onFollowupScheduled()
        onOpenChange(false)
      } else {
        console.error("Error from scheduleLeadFollowup:", result.message)
        setError(result.message || "Failed to schedule follow-up")
        toast({
          title: "Failed to schedule follow-up",
          description: result.message || "An error occurred while scheduling the follow-up",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Exception in handleSubmit:", error)
      setError("An unexpected error occurred. Please try again.")
      toast({
        title: "Failed to schedule follow-up",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Schedule Follow-up</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 p-6">
          <div className="grid gap-2">
            <Label>Lead</Label>
            <div className="text-sm font-medium">
              {lead.client_name} ({lead.lead_number})
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Follow-up Type</Label>
            <Select value={followupType} onValueChange={setFollowupType}>
              <SelectTrigger>
                <SelectValue placeholder="Select follow-up type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="site-visit">Site Visit</SelectItem>
                <SelectItem value="demo">Product Demo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Date</Label>
            <div className="flex flex-col space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    showOutsideDays={false}
                    numberOfMonths={1}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>

              <div className="flex flex-wrap gap-2">
                {quickDateOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const newDate = option.getValue()
                      setDate(newDate)
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Time</Label>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1" />
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {["09:00", "12:00", "15:00", "17:00"].map((timeOption) => (
                <Button
                  key={timeOption}
                  variant={time === timeOption ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setTime(timeOption)}
                >
                  {format(
                    new Date().setHours(
                      Number.parseInt(timeOption.split(":")[0]),
                      Number.parseInt(timeOption.split(":")[1]),
                    ),
                    "h:mm a",
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this follow-up"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
        <DialogFooter className="p-6 pt-0">
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
