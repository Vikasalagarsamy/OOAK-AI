"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { createFollowUp } from "@/actions/follow-up-actions"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  lead_id: z.number().positive("Lead ID is required"),
  scheduled_at: z.string().min(1, "Scheduled date and time is required"),
  followup_type: z.enum([
    "email",
    "phone",
    "in_person",
    "video_call",
    "text_message",
    "social_media",
    "other",
  ] as const),
  notes: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"] as const),
  interaction_summary: z.string().optional(),
})

type ScheduleFollowUpFormProps = {
  leadId: number
  leadName: string
  onSuccess?: () => void
}

export function ScheduleFollowUpForm({ leadId, leadName, onSuccess }: ScheduleFollowUpFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lead_id: leadId,
      scheduled_at: new Date().toISOString(), // Set default to current time
      followup_type: "phone",
      notes: "",
      priority: "medium",
      interaction_summary: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // Log the values being submitted
      console.log("Submitting follow-up form with values:", values)

      const result = await createFollowUp(values)

      // Log the result for debugging
      console.log("Follow-up creation result:", result)

      if (result.success) {
        toast({
          title: "Follow-up scheduled",
          description: result.message,
        })
        form.reset()
        if (onSuccess) {
          onSuccess()
        }
      } else {
        console.error("Follow-up creation error details:", result.error)

        toast({
          title: "Error",
          description: result.message || "Failed to schedule follow-up",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Unexpected error during follow-up creation:", error)

      toast({
        title: "Error",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? (error as Error).message
            : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-muted p-4 rounded-md mb-4">
          <h3 className="font-medium">Scheduling follow-up for:</h3>
          <p className="text-sm">{leadName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="scheduled_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date and Time</FormLabel>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const currentValue = field.value ? new Date(field.value) : new Date()
                            const hours = currentValue.getHours()
                            const minutes = currentValue.getMinutes()

                            date.setHours(hours)
                            date.setMinutes(minutes)

                            field.onChange(date.toISOString())
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Input
                    type="time"
                    className="w-[140px]"
                    onChange={(e) => {
                      const timeString = e.target.value
                      if (timeString && field.value) {
                        const date = new Date(field.value)
                        const [hours, minutes] = timeString.split(":").map(Number)

                        date.setHours(hours)
                        date.setMinutes(minutes)

                        field.onChange(date.toISOString())
                      } else if (timeString) {
                        const date = new Date()
                        const [hours, minutes] = timeString.split(":").map(Number)

                        date.setHours(hours)
                        date.setMinutes(minutes)

                        field.onChange(date.toISOString())
                      }
                    }}
                    value={field.value ? format(new Date(field.value), "HH:mm") : ""}
                  />
                </div>
                <FormDescription>When should this follow-up occur?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="followup_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Follow-up Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a follow-up type" />
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
                <FormDescription>How will you contact the lead?</FormDescription>
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
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Set the priority level for this follow-up</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interaction_summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interaction Summary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary of what this follow-up is about"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Provide a brief summary of what this follow-up will cover</FormDescription>
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
                <Textarea placeholder="Any additional notes or details" className="resize-none" {...field} />
              </FormControl>
              <FormDescription>Add any additional notes or details about this follow-up</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              Scheduling...
            </>
          ) : (
            "Schedule Follow-up"
          )}
        </Button>
      </form>
    </Form>
  )
}
