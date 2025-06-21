import { Users, Plus } from "lucide-react"
import { EventsHeader } from "@/components/events/events-header"
import { EventsSubmenu } from "@/components/events/events-submenu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function StaffAssignmentPage() {
  // Sample staff assignments data
  const assignments = [
    {
      id: 1,
      event: "Annual Conference 2023",
      employee: "John Smith",
      role: "Event Manager",
      department: "Operations",
      startDate: "2023-05-15",
      endDate: "2023-05-17",
    },
    {
      id: 2,
      event: "Annual Conference 2023",
      employee: "Sarah Johnson",
      role: "Registration Lead",
      department: "Customer Service",
      startDate: "2023-05-15",
      endDate: "2023-05-17",
    },
    {
      id: 3,
      event: "Product Launch",
      employee: "Michael Brown",
      role: "Technical Support",
      department: "IT",
      startDate: "2023-06-10",
      endDate: "2023-06-10",
    },
    {
      id: 4,
      event: "Product Launch",
      employee: "Emily Davis",
      role: "Presenter",
      department: "Marketing",
      startDate: "2023-06-10",
      endDate: "2023-06-10",
    },
    {
      id: 5,
      event: "Team Building Workshop",
      employee: "Robert Wilson",
      role: "Facilitator",
      department: "HR",
      startDate: "2023-07-05",
      endDate: "2023-07-05",
    },
  ]

  return (
    <div className="space-y-6">
      <EventsHeader
        title="Staff Assignment"
        icon={<Users className="h-6 w-6" />}
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </EventsHeader>

      <EventsSubmenu />

      <Card>
        <CardHeader>
          <CardTitle>Staff Assignments</CardTitle>
          <CardDescription>Current staff assignments for upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.event}</TableCell>
                  <TableCell>{assignment.employee}</TableCell>
                  <TableCell>{assignment.role}</TableCell>
                  <TableCell>{assignment.department}</TableCell>
                  <TableCell>{assignment.startDate}</TableCell>
                  <TableCell>{assignment.endDate}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      Remove
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
