import EventManagement from "@/components/events/event-management"

export default function EventsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-2">
          Manage your events and their active status.
        </p>
      </div>
      
      <EventManagement />
    </div>
  )
}
