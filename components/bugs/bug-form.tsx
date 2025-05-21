"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createBug } from "@/actions/bug-actions"
import { useToast } from "@/hooks/use-toast"
import type { Bug } from "@/types/bug"

interface BugFormProps {
  bug?: Bug // Optional for edit mode
  onSave?: (bug: Bug) => void
}

export function BugForm({ bug, onSave }: BugFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date | undefined>(bug?.due_date ? new Date(bug.due_date) : undefined)

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)

      if (date) {
        formData.set("due_date", date.toISOString())
      } else {
        formData.delete("due_date")
      }

      const result = await createBug(formData)

      if (result.success) {
        toast({
          title: "Bug created successfully",
          description: "Your bug report has been submitted.",
        })

        if (onSave && result.data) {
          onSave(result.data)
        } else {
          router.push(`/admin/bugs/${result.data.id}`)
        }
      } else {
        toast({
          title: "Failed to create bug",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting bug:", error)
      toast({
        title: "Error",
        description: "Failed to submit bug report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Bug Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Enter a concise bug title"
                required
                defaultValue={bug?.title}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide detailed bug description, steps to reproduce, expected vs actual behavior"
                rows={5}
                required
                defaultValue={bug?.description}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="severity" className="block text-sm font-medium mb-1">
                  Severity <span className="text-destructive">*</span>
                </label>
                <Select name="severity" defaultValue={bug?.severity || "medium"} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="assignee_id" className="block text-sm font-medium mb-1">
                  Assignee
                </label>
                <Select name="assignee_id" defaultValue={bug?.assignee_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {/* This would typically be populated with user data from the database */}
                    <SelectItem value="user_id_1">John Doe</SelectItem>
                    <SelectItem value="user_id_2">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium mb-1">
                  Due Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "No due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                    {date && (
                      <div className="p-3 border-t">
                        <Button variant="ghost" className="w-full" onClick={() => setDate(undefined)}>
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/bugs")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Bug"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
