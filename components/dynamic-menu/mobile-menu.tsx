"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMenu } from "@/hooks/use-menu"
import { MenuIcon } from "./menu-icon"
import { MenuIcon as MenuIcon2, ChevronDown, ChevronRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MenuItemWithPermission } from "@/types/menu"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  className?: string
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const { menu, loading } = useMenu()
  const pathname = usePathname()

  // Track expanded items
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  const toggleExpanded = (id: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Filter out menu items with no children and no path (these would be useless dividers)
  const filteredMenu = menu?.filter((item) => (item.children && item.children.length > 0) || item.path) || []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("md:hidden", className)}>
          <MenuIcon2 className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <ScrollArea className="h-[calc(100vh-3rem)]">
          <div className="p-6 space-y-2">
            <h2 className="text-lg font-semibold mb-4">Menu</h2>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading menu...</p>
            ) : filteredMenu.length === 0 ? (
              <p className="text-sm text-muted-foreground">No menu items available</p>
            ) : (
              <div className="space-y-1">
                {filteredMenu.map((item) => (
                  <MobileMenuItem
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    expanded={!!expandedItems[item.id]}
                    onToggle={() => toggleExpanded(item.id)}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface MobileMenuItemProps {
  item: MenuItemWithPermission
  pathname: string
  expanded: boolean
  onToggle: () => void
  onNavigate: () => void
  depth?: number
}

function MobileMenuItem({ item, pathname, expanded, onToggle, onNavigate, depth = 0 }: MobileMenuItemProps) {
  // Skip items the user doesn't have permission to view
  if (!item.permissions.canView) {
    return null
  }

  const active = isActive(item.path, pathname)
  const hasChildren = item.children && item.children.length > 0
  const visibleChildren = item.children?.filter((child) => child.permissions.canView) || []

  // Skip this item if it has no children AND no path (useless menu item)
  if (visibleChildren.length === 0 && !item.path) {
    return null
  }

  const paddingLeft = depth * 16 + "px"

  return (
    <div>
      <div className="flex items-center">
        {/* If this item has a path, make it a link */}
        {item.path ? (
          <Link
            href={item.path}
            className={cn(
              "flex items-center gap-2 w-full py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
              active ? "font-medium bg-accent text-accent-foreground" : "",
            )}
            style={{ paddingLeft }}
            onClick={onNavigate}
          >
            {item.icon && <MenuIcon name={item.icon} className="h-4 w-4 flex-shrink-0" />}
            <span className="flex-grow truncate">{item.name}</span>
            {hasChildren && visibleChildren.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault()
                  onToggle()
                }}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </Link>
        ) : (
          /* If no path, make it a toggle button */
          <button
            className={cn(
              "flex items-center gap-2 w-full py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
              expanded ? "font-medium" : "",
            )}
            style={{ paddingLeft }}
            onClick={onToggle}
          >
            {item.icon && <MenuIcon name={item.icon} className="h-4 w-4 flex-shrink-0" />}
            <span className="flex-grow truncate">{item.name}</span>
            {hasChildren &&
              visibleChildren.length > 0 &&
              (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
          </button>
        )}
      </div>

      {/* Render children if expanded */}
      {hasChildren && expanded && (
        <div className="mt-1 space-y-1">
          {visibleChildren.map((child) => (
            <MobileMenuItem
              key={child.id}
              item={child}
              pathname={pathname}
              expanded={false}
              onToggle={() => {}}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Helper function to check if a path is active
function isActive(itemPath: string | undefined, pathname: string): boolean {
  if (!itemPath) return false

  // Exact match
  if (itemPath === pathname) return true

  // Parent route match (e.g. /organization is active when on /organization/companies)
  if (pathname.startsWith(`${itemPath}/`)) return true

  return false
}
