import type React from "react"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function PeopleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <SidebarNavigation />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Breadcrumbs />
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
