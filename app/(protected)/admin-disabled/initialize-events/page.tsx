import type { Metadata } from "next"
import { InitializeEventsTable } from "@/components/admin/initialize-events-table"

export const metadata: Metadata = {
  title: "Initialize Events Table",
  description: "Create the events table in the database",
}

export default function InitializeEventsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Database Initialization</h1>
      <p className="text-gray-500 mb-8">
        Use this page to initialize the events table in the database. This is required before you can start creating and
        managing events.
      </p>

      <InitializeEventsTable />
    </div>
  )
}
