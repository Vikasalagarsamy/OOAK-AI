"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MenuIcon } from "./menu-icon"
import { Skeleton } from "@/components/ui/skeleton"
import type { MenuItemWithPermission } from "@/types/menu"

interface EnhancedDesktopMenuProps {
  menu: MenuItemWithPermission[]
  loading: boolean
  className?: string
}

export function EnhancedDesktopMenu({ menu, loading, className }: EnhancedDesktopMenuProps) {
  const pathname = usePathname()

  if (loading) {
    return (
      <div className={cn("hidden md:flex items-center space-x-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
    )
  }

  // Filter top-level menu items
  const topLevelItems = menu.filter((item) => item.parentId === null)

  return (
    <nav className={cn("hidden md:flex items-center space-x-4", className)}>
      {topLevelItems.map((item) => {
        // Skip items without view permission
        if (!item.permissions.canView) return null

        // Check if this item or any of its children is active
        const isActive = isItemActive(item, pathname)

        return (
          <div key={item.id} className="relative group">
            {item.path ? (
              <Link
                href={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                )}
              >
                {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
                {item.name}
              </Link>
            ) : (
              <div
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                )}
              >
                {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
                {item.name}
              </div>
            )}

            {/* Dropdown for items with children */}
            {item.children && item.children.length > 0 && (
              <div className="absolute left-0 mt-1 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                <div className="py-1">
                  {item.children
                    .filter((child) => child.permissions.canView)
                    .map((child) => (
                      <Link
                        key={child.id}
                        href={child.path || "#"}
                        className={cn(
                          "block px-4 py-2 text-sm",
                          pathname === child.path
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        )}
                      >
                        <div className="flex items-center">
                          {child.icon && <MenuIcon name={child.icon} className="mr-2 h-4 w-4" />}
                          {child.name}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

// Helper function to check if an item or any of its children is active
function isItemActive(item: MenuItemWithPermission, pathname: string): boolean {
  if (item.path === pathname) return true

  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isItemActive(child, pathname))
  }

  return false
}
