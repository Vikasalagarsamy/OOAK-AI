import { CalendarIcon } from "lucide-react"
import { EventsHeader } from "@/components/events/events-header"
import { EventsSubmenu } from "@/components/events/events-submenu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function EventCalendarPage() {
  return (
    <div className="space-y-6">
      <EventsHeader
        title="Event Calendar"
        
        icon={<CalendarIcon className="h-6 w-6" />}
      />

      <EventsSubmenu />

      <Card>
        <CardHeader>
          <CardTitle>Event Calendar</CardTitle>
          <CardDescription>View all scheduled events in a calendar format</CardDescription>
        </CardHeader>
        <CardContent className="h-[600px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <CalendarIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
            <p>Calendar view will be implemented here</p>
            <p className="text-sm mt-2">This will display all events in a monthly calendar format</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
