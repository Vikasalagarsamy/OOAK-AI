import type React from "react"
import type { Metadata } from "next"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Reports | ONE OF A KIND PORTAL",
  description: "Analytics and reporting dashboards",
}

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Breadcrumbs />
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
