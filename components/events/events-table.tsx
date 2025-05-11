"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Calendar, Copy } from "lucide-react"
import type { Event } from "@/types/event"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface EventsTableProps {
  events: Event[]
  onToggleStatus: (id: string) => void
}

export function EventsTable({ events, onToggleStatus }: EventsTableProps) {
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `Event ID "${text}" has been copied to clipboard.`,
      duration: 3000,
    })
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
            <TableHead>Event Name</TableHead>
            <TableHead>Event ID</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.name}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {event.id}
                  </code>
                  <button onClick={() => copyToClipboard(event.id)} className="text-gray-500 hover:text-gray-700">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
              <TableCell>{formatDate(event.createdAt)}</TableCell>
              <TableCell>
                <Badge variant={event.isActive ? "success" : "secondary"}>
                  {event.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={event.isActive}
                  onCheckedChange={() => onToggleStatus(event.id)}
                  aria-label={`Toggle ${event.name} status`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
