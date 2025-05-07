"use client"

import { usePathname } from "next/navigation"
import { useMenu } from "@/hooks/use-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import type { MenuItemWithPermission } from "@/types/menu"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface DesktopMenuProps {
  className?: string
}

export function DesktopMenu({ className }: DesktopMenuProps) {
  const { menu, loading, error, refreshMenu } = useMenu()
  const pathname = usePathname()
  const [topLevelItems, setTopLevelItems] = useState<MenuItemWithPermission[]>([])

  useEffect(() => {
    console.log("DesktopMenu rendered with:", {
      menuItems: menu?.length || 0,
      loading,
      error,
    })

    // Filter out items that should be shown in the top-level navigation
    if (menu && menu.length > 0) {
      const filteredItems = menu.filter((item) => {
        // Only include items that have a path or have children with paths
        return item.path || (item.children && item.children.some((child) => child.path))
      })

      setTopLevelItems(filteredItems)

      console.log(
        "Top-level menu items:",
        filteredItems.map((item) => ({
          id: item.id,
          name: item.name,
          path: item.path,
          permissions: item.permissions,
          children: item.children?.length || 0,
        })),
      )
    }
  }, [menu, loading, error])

  const handleRefresh = () => {
    refreshMenu()
  }

  return (
    <nav className={cn("hidden md:flex items-center space-x-4", className)}>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading menu...</div>
      ) : error ? (
        <div className="flex items-center gap-2">
          <div className="text-sm text-red-500">Error: {error}</div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      ) : !topLevelItems || topLevelItems.length === 0 ? (
        <div className="flex items-center gap-2">
          <div className="text-sm text-yellow-500">No menu items</div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      ) : (
        topLevelItems.map((item) => (
          <Link
            key={item.id}
            href={item.path || "#"}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.path || pathname.startsWith(item.path + "/") ? "text-primary" : "text-muted-foreground",
            )}
          >
            {item.name}
          </Link>
        ))
      )}
    </nav>
  )
}
