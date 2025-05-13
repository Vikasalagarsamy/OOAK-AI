"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SimpleSidebar } from "@/components/simple-sidebar"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { cn } from "@/lib/utils"
import { MenuIcon, X } from "lucide-react"
import { usePathname } from "next/navigation"

type MainLayoutProps = {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar when route changes (on mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Handle responsive sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        {/* Mobile sidebar toggle button */}
        <button
          onClick={toggleSidebar}
          className="mr-2 block md:hidden"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </Header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - always visible on desktop, conditionally visible on mobile */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out z-30 bg-background border-r",
            "md:w-64 md:static md:block md:overflow-y-auto md:transform-none",
            sidebarOpen
              ? "fixed inset-y-0 left-0 w-64 transform translate-x-0 overflow-y-auto"
              : "fixed inset-y-0 left-0 w-64 transform -translate-x-full overflow-y-auto",
          )}
        >
          <SimpleSidebar />
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Breadcrumbs />
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}
