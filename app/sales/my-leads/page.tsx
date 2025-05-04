import type { Metadata } from "next"
import { MyLeadsList } from "@/components/my-leads-list"

export const metadata: Metadata = {
  title: "My Leads | Sales Dashboard",
  description: "View and manage leads assigned to you",
}

export default function MyLeadsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Leads</h1>
        <p className="text-muted-foreground">View and manage leads that have been assigned to you</p>
      </div>

      <MyLeadsList />
    </div>
  )
}
