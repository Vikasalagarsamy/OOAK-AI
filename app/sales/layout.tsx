import type React from "react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { SidebarNavigation } from "@/components/sidebar-navigation"

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNavigation />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Breadcrumbs />
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
