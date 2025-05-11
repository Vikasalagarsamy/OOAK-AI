import type { Metadata } from "next"
import EventManagement from "@/components/events/event-management"

export const metadata: Metadata = {
  title: "Event Management",
  description: "Create and manage events for client quotations",
}

export default function EventsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Event Management</h1>
      <EventManagement />
    </div>
  )
}
