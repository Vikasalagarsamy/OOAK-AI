"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { scheduleLeadFollowup } from "@/actions/lead-actions"

const followupSchema = z.object({
  leadId: z.number(),
  scheduledAt: z.date(),
  followupType: z.string(),
  priority: z.string(),
  summary: z.string().optional(),
  notes: z.string().optional(),
})

type FollowupFormValues = z.infer<typeof followupSchema>

interface ScheduleFollowupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: number
}

export function ScheduleFollowupDialog({ open, onOpenChange, leadId }: ScheduleFollowupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeHours, setTimeHours] = useState("12")
  const [timeMinutes, setTimeMinutes] = useState("00")
  const [timePeriod, setTimePeriod] = useState("PM")

  const form = useForm<FollowupFormValues>({
    resolver: zodResolver(followupSchema),
    defaultValues: {
      leadId,
      scheduledAt: new Date(),
      followupType: "phone",
      priority: "medium",
      summary: "",
      notes: "",
    },
  })

  const onSubmit = async (values: FollowupFormValues) => {
    try {
      setIsSubmitting(true)

      // Set the time on the scheduled date
      const scheduledDate = new Date(values.scheduledAt)
      let hours = Number.parseInt(timeHours)
      if (timePeriod === "PM" && hours < 12) hours += 12
      if (timePeriod === "AM" && hours === 12) hours = 0
      scheduledDate.setHours(hours, Number.parseInt(timeMinutes), 0, 0)
      values.scheduledAt = scheduledDate

      console.log("Submitting follow-up with values:", values)

      const result = await scheduleLeadFollowup({
        leadId: values.leadId,
        scheduledAt: values.scheduledAt.toISOString(),
        followupType: values.followupType,
        notes: values.notes,
        priority: values.priority,
        summary: values.summary,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Follow-up scheduled successfully",
        })
        onOpenChange(false)
      } else {
        console.error("Failed to schedule follow-up:", result.message)
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error scheduling follow-up:", error)
      toast({
        title: "Error",
        description: "Failed to schedule follow-up. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full pl-3 text-left font-normal">
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <FormLabel>Time</FormLabel>
                  <Select value={timeHours} onValueChange={setTimeHours}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 pt-7">
                  <span className="text-center block">:</span>
                </div>
                <div className="col-span-1">
                  <FormLabel>&nbsp;</FormLabel>
                  <Select value={timeMinutes} onValueChange={setTimeMinutes}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")).map((min) => (
                        <SelectItem key={min} value={min}>
                          {min}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <FormLabel>&nbsp;</FormLabel>
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FormField
                control={form.control}
                name="followupType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select follow-up type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="video_call">Video Call</SelectItem>
                        <SelectItem value="text_message">Text Message</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a brief summary of what this follow-up will cover"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes or details about this follow-up"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Follow-up"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
