import { MapPin, Plus } from "lucide-react"
import { EventsHeader } from "@/components/events/events-header"
import { EventsSubmenu } from "@/components/events/events-submenu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function VenuesPage() {
  // Sample venues data
  const venues = [
    {
      id: 1,
      name: "Main Conference Hall",
      address: "123 Business Ave, Suite 100",
      capacity: 500,
      facilities: "Wi-Fi, Projector, Sound System",
      status: "Available",
    },
    {
      id: 2,
      name: "Executive Meeting Room",
      address: "123 Business Ave, Suite 200",
      capacity: 20,
      facilities: "Wi-Fi, Projector, Video Conferencing",
      status: "Available",
    },
    {
      id: 3,
      name: "Training Center",
      address: "456 Learning Blvd",
      capacity: 100,
      facilities: "Wi-Fi, Projector, Whiteboards",
      status: "Booked",
    },
    {
      id: 4,
      name: "Exhibition Hall",
      address: "789 Expo Drive",
      capacity: 1000,
      facilities: "Wi-Fi, Sound System, Booth Space",
      status: "Available",
    },
    {
      id: 5,
      name: "Outdoor Pavilion",
      address: "321 Park Road",
      capacity: 300,
      facilities: "Power Outlets, Covered Area",
      status: "Under Maintenance",
    },
  ]

  return (
    <div className="space-y-6">
      <EventsHeader
        title="Venues"
        description="Manage locations where events are held"
        icon={<MapPin className="h-6 w-6" />}
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Venue
        </Button>
      </EventsHeader>

      <EventsSubmenu />

      <Card>
        <CardHeader>
          <CardTitle>Venues</CardTitle>
          <CardDescription>List of all venues available for events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Facilities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell>{venue.address}</TableCell>
                  <TableCell>{venue.capacity}</TableCell>
                  <TableCell>{venue.facilities}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        venue.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : venue.status === "Booked"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {venue.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
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
