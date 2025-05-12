"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { VALID_FOLLOWUP_TYPES, scheduleLeadFollowup } from "@/actions/follow-up-actions"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  leadId: z.number(),
  scheduledAt: z.date({
    required_error: "Follow-up date is required",
  }),
  followupType: z.enum(VALID_FOLLOWUP_TYPES, {
    required_error: "Please select a follow-up type",
  }),
  notes: z.string().optional(),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  summary: z.string().min(3, "Summary must be at least 3 characters").optional(),
})

type ScheduleFollowupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: number
  onSuccess?: () => void
}

export function ScheduleFollowupDialog({ open, onOpenChange, leadId, onSuccess }: ScheduleFollowupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leadId,
      scheduledAt: new Date(),
      followupType: "phone",
      priority: "medium",
      notes: "",
      summary: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      console.log("Submitting follow-up form with values:", values)

      // Validate date is not in the past
      if (values.scheduledAt < new Date(new Date().setHours(0, 0, 0, 0))) {
        toast({
          variant: "destructive",
          title: "Invalid date",
          description: "Follow-up date cannot be in the past",
        })
        setIsSubmitting(false)
        return
      }

      // Convert the date to ISO string for the API
      const result = await scheduleLeadFollowup({
        ...values,
        scheduledAt: values.scheduledAt.toISOString(),
      })

      if (result.success) {
        toast({
          title: "Follow-up Saved",
          description: "The follow-up has been successfully scheduled",
          variant: "default",
        })
        form.reset()
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          variant: "destructive",
          title: "Failed to save follow-up",
          description: result.message || "An error occurred while saving to the database",
        })
        console.error("Error scheduling follow-up:", result)
      }
    } catch (error) {
      console.error("Error in follow-up submission:", error)
      toast({
        variant: "destructive",
        title: "System Error",
        description: "An unexpected error occurred. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    const isDirty = form.formState.isDirty

    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        form.reset()
        onOpenChange(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
          <DialogDescription>Schedule a follow-up for this lead</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="followupType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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
            </div>

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
                    <Textarea placeholder="Brief summary of what this follow-up is about" {...field} />
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
                    <Textarea placeholder="Any additional notes or details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Saving...
                  </>
                ) : (
                  "Save Follow-up"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
