import type { ReactNode } from "react"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Breadcrumbs />
          {children}
        </div>
      </div>
    </div>
  )
}
