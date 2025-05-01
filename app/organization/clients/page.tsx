"use client"

import { ClientList } from "@/components/client-list"

export default function ClientsPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Client Management</h1>
        <p className="text-muted-foreground">
          Manage your clients and their information. Clients are categorized by type and associated with companies.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <ClientList />
      </div>
    </main>
  )
}
