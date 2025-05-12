"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search } from "lucide-react"
import { EventsTable } from "./events-table"
import { AddEventDialog } from "./add-event-dialog"
import { EditEventDialog } from "./edit-event-dialog"
import { DeleteEventDialog } from "./delete-event-dialog"
import { useToast } from "@/components/ui/use-toast"
import type { Event } from "@/types/event"
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventStatus,
  searchEvents,
} from "@/actions/event-actions"

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load events from database on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true)
        const data = await getEvents()
        setEvents(data)
      } catch (error) {
        console.error("Failed to load events:", error)
        toast({
          title: "Error loading events",
          description: "There was a problem loading the events. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [toast])

  const handleAddEvent = async (name: string, isActive: boolean) => {
    try {
      const newEvent = await createEvent(name, isActive)
      setEvents((prevEvents) => [newEvent, ...prevEvents])
      setIsAddDialogOpen(false)

      toast({
        title: "Event created",
        description: `"${name}" has been added successfully.`,
      })
    } catch (error) {
      console.error("Failed to create event:", error)
      toast({
        title: "Error creating event",
        description: "There was a problem creating the event. Please try again.",
        variant: "destructive",
      })
      throw error // Re-throw to handle in the form
    }
  }

  const handleEditEvent = async (eventId: string, name: string, isActive: boolean) => {
    try {
      const updatedEvent = await updateEvent(eventId, name, isActive)
      setEvents((prevEvents) => prevEvents.map((event) => (event.event_id === eventId ? updatedEvent : event)))

      toast({
        title: "Event updated",
        description: `"${name}" has been updated successfully.`,
      })
    } catch (error) {
      console.error("Failed to update event:", error)
      toast({
        title: "Error updating event",
        description: "There was a problem updating the event. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      setEvents((prevEvents) => prevEvents.filter((event) => event.event_id !== eventId))

      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      })
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast({
        title: "Error deleting event",
        description: "There was a problem deleting the event. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleToggleStatus = async (eventId: string) => {
    try {
      const updatedEvent = await toggleEventStatus(eventId)

      setEvents((prevEvents) =>
        prevEvents.map((event) => {
          if (event.event_id === eventId) {
            toast({
              title: "Status updated",
              description: `"${event.name}" is now ${updatedEvent.is_active ? "active" : "inactive"}.`,
            })
            return updatedEvent
          }
          return event
        }),
      )
    } catch (error) {
      console.error("Failed to toggle event status:", error)
      toast({
        title: "Error updating status",
        description: "There was a problem updating the event status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is cleared, load all events
      const data = await getEvents()
      setEvents(data)
      return
    }

    try {
      const results = await searchEvents(searchQuery)
      setEvents(results)
    } catch (error) {
      console.error("Failed to search events:", error)
      toast({
        title: "Error searching events",
        description: "There was a problem searching for events. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Open edit dialog
  const openEditDialog = (event: Event) => {
    setSelectedEvent(event)
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event)
    setIsDeleteDialogOpen(true)
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

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

      <EventsTable
        events={events}
        onToggleStatus={handleToggleStatus}
        onEditEvent={openEditDialog}
        onDeleteEvent={openDeleteDialog}
        isLoading={isLoading}
      />

      <AddEventDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddEvent={handleAddEvent} />

      <EditEventDialog
        event={selectedEvent}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEditEvent={handleEditEvent}
      />

      <DeleteEventDialog
        event={selectedEvent}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  )
}
