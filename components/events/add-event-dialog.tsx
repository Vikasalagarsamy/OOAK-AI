"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddEvent: (name: string, isActive: boolean) => void
}

export function AddEventDialog({ open, onOpenChange, onAddEvent }: AddEventDialogProps) {
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Event name is required")
      return
    }

    onAddEvent(name.trim(), isActive)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setIsActive(true)
    setError("")
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>Create a new event for client quotations.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="required">
                Event Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (e.target.value.trim()) setError("")
                }}
                placeholder="Enter event name"
                className={error ? "border-red-500" : ""}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status">Active Status</Label>
              <Switch id="status" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
