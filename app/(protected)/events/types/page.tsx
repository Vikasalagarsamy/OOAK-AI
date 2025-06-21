import { ClipboardList, Plus } from "lucide-react"
import { EventsHeader } from "@/components/events/events-header"
import { EventsSubmenu } from "@/components/events/events-submenu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function EventTypesPage() {
  // Sample event types data
  const eventTypes = [
    { id: 1, name: "Conference", description: "Large formal events with presentations", count: 5 },
    { id: 2, name: "Workshop", description: "Interactive learning sessions", count: 8 },
    { id: 3, name: "Seminar", description: "Educational events with speakers", count: 3 },
    { id: 4, name: "Trade Show", description: "Exhibition of products or services", count: 2 },
    { id: 5, name: "Team Building", description: "Activities to improve team cohesion", count: 6 },
  ]

  return (
    <div className="space-y-6">
      <EventsHeader
        title="Event Types"
        icon={<ClipboardList className="h-6 w-6" />}
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Event Type
        </Button>
      </EventsHeader>

      <EventsSubmenu />

      <Card>
        <CardHeader>
          <CardTitle>Event Types</CardTitle>
          <CardDescription>List of all event types and their usage</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Events Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.description}</TableCell>
                  <TableCell>{type.count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
