"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import SidebarNavigation from "@/components/sidebar-navigation"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen relative">
      {/* Force sidebar to be visible */}
      <div className="w-64 flex-shrink-0">
        <SidebarNavigation />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container py-6 px-4">{children}</div>
      </div>
    </div>
  )
}
