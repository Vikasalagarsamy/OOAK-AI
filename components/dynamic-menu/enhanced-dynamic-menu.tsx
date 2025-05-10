"use client"

import { useEnhancedMenu } from "@/hooks/use-enhanced-menu"
import Link from "next/link"
import { useMobile } from "@/hooks/use-mobile"
import { Skeleton } from "@/components/ui/skeleton"

export function EnhancedDynamicMenu() {
  const { menuItems = [], isLoading, error } = useEnhancedMenu()
  const isMobile = useMobile()

  if (isLoading) {
    return (
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    )
  }

  if (error) {
    console.warn("Menu error:", error)
    // Return a minimal navigation
    return (
      <div className="flex space-x-4">
        <Link href="/dashboard" className="text-sm font-medium">
          Dashboard
        </Link>
      </div>
    )
  }

  // Safely filter top-level menu items with null check
  const topLevelItems = Array.isArray(menuItems) ? menuItems.filter((item) => !item.parentId) : []

  return (
    <nav className="flex items-center space-x-4">
      {topLevelItems.length > 0 ? (
        topLevelItems.map((item) => (
          <Link
            key={item.id || `menu-${Math.random()}`}
            href={item.path || "#"}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {item.name || "Menu Item"}
          </Link>
        ))
      ) : (
        // Fallback when no menu items are available
        <Link href="/dashboard" className="text-sm font-medium">
          Dashboard
        </Link>
      )}
    </nav>
  )
}
