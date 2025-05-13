import type React from "react"
import type { Metadata } from "next"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "View and search system audit logs",
}

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNavigation />
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="container mx-auto py-6 space-y-6">
          <Breadcrumbs />
          {children}
        </div>
      </div>
    </div>
  )
}
