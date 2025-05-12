"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { Event } from "@/types/event"

interface EditEventDialogProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditEvent: (eventId: string, name: string, isActive: boolean) => Promise<void>
}

export function EditEventDialog({ event, open, onOpenChange, onEditEvent }: EditEventDialogProps) {
  const [name, setName] = useState(event?.name || "")
  const [isActive, setIsActive] = useState(event?.is_active || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens with a new event
  useState(() => {
    if (event) {
      setName(event.name)
      setIsActive(event.is_active)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!event) return

    if (!name.trim()) {
      setError("Event name is required")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onEditEvent(event.event_id, name.trim(), isActive)
      onOpenChange(false)
    } catch (err) {
      console.error("Error editing event:", err)
      setError("Failed to edit event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter event name"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active Status</Label>
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} disabled={isSubmitting} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
