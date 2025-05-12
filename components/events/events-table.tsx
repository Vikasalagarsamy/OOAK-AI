"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Calendar, Copy, Pencil, Trash2 } from "lucide-react"
import type { Event } from "@/types/event"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface EventsTableProps {
  events: Event[]
  onToggleStatus: (eventId: string) => Promise<void>
  onEditEvent: (event: Event) => void
  onDeleteEvent: (event: Event) => void
  isLoading?: boolean
}

export function EventsTable({
  events,
  onToggleStatus,
  onEditEvent,
  onDeleteEvent,
  isLoading = false,
}: EventsTableProps) {
  const { toast } = useToast()

  // Function to format the date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "Invalid date"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `Event ID "${text}" has been copied to clipboard.`,
      duration: 3000,
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-24 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No events found</h3>
        <p className="text-sm text-gray-500 mt-2">Get started by creating a new event.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.event_id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {event.event_id}
                  </code>
                  <button onClick={() => copyToClipboard(event.event_id)} className="text-gray-500 hover:text-gray-700">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
              <TableCell className="font-medium">{event.name}</TableCell>
              <TableCell>
                <Badge variant={event.is_active ? "success" : "secondary"}>
                  {event.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{formatDate(event.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Switch
                    checked={event.is_active}
                    onCheckedChange={() => onToggleStatus(event.event_id)}
                    aria-label={`Toggle ${event.name} status`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditEvent(event)}
                    aria-label={`Edit ${event.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteEvent(event)}
                    aria-label={`Delete ${event.name}`}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
