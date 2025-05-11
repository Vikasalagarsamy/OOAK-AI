"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search } from "lucide-react"
import { EventsTable } from "./events-table"
import { AddEventDialog } from "./add-event-dialog"
import { useToast } from "@/components/ui/use-toast"
import type { Event } from "@/types/event"

// Generate a unique event ID with EVT prefix
const generateEventId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `EVT-${timestamp.substring(timestamp.length - 4)}${randomStr}`
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("events")
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents))
      } catch (error) {
        console.error("Failed to parse saved events:", error)
      }
    }
  }, [])

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events))
  }, [events])

  const handleAddEvent = (name: string, isActive: boolean) => {
    const newEvent: Event = {
      id: generateEventId(),
      name,
      isActive,
      createdAt: new Date().toISOString(),
    }

    setEvents((prevEvents) => [newEvent, ...prevEvents])
    setIsAddDialogOpen(false)

    toast({
      title: "Event created",
      description: `"${name}" has been added successfully.`,
    })
  }

  const handleToggleStatus = (id: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === id) {
          const updatedEvent = { ...event, isActive: !event.isActive }

          toast({
            title: "Status updated",
            description: `"${event.name}" is now ${updatedEvent.isActive ? "active" : "inactive"}.`,
          })

          return updatedEvent
        }
        return event
      }),
    )
  }

  // Filter events based on search query
  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search events..."
            className="w-full sm:w-[300px] pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <EventsTable events={filteredEvents} onToggleStatus={handleToggleStatus} />

      <AddEventDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddEvent={handleAddEvent} />
    </div>
  )
}
