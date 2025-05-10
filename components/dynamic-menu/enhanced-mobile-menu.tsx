"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MenuIcon } from "./menu-icon"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { MenuItemWithPermission } from "@/types/menu"

interface EnhancedMobileMenuProps {
  menu: MenuItemWithPermission[]
  loading: boolean
  className?: string
}

export function EnhancedMobileMenu({ menu, loading, className }: EnhancedMobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Filter top-level menu items
  const topLevelItems = menu.filter((item) => item.parentId === null)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("md:hidden", className)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">Menu</div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-4 pb-8">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {topLevelItems
                  .filter((item) => item.permissions.canView)
                  .map((item) => (
                    <MobileMenuItem key={item.id} item={item} pathname={pathname} onSelect={() => setOpen(false)} />
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
  onSelect: () => void
}

function MobileMenuItem({ item, pathname, onSelect }: MobileMenuItemProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.path

  // Check if any child is active
  const isChildActive =
    hasChildren &&
    item.children.some(
      (child) =>
        pathname === child.path ||
        (child.children && child.children.some((grandchild) => pathname === grandchild.path)),
    )

  // Auto-expand if a child is active
  useState(() => {
    if (isChildActive) {
      setExpanded(true)
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        {item.path ? (
          <Link
            href={item.path}
            className={cn(
              "flex items-center py-2 px-3 rounded-md text-sm font-medium w-full",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
            )}
            onClick={onSelect}
          >
            {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
            {item.name}
          </Link>
        ) : (
          <button
            className={cn(
              "flex items-center py-2 px-3 rounded-md text-sm font-medium w-full text-left",
              isActive || isChildActive || expanded
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10",
            )}
            onClick={() => setExpanded(!expanded)}
          >
            {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
            {item.name}
          </button>
        )}

        {hasChildren && (
          <Button variant="ghost" size="sm" className="px-2" onClick={() => setExpanded(!expanded)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Button>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-3">
          {item.children
            .filter((child) => child.permissions.canView)
            .map((child) => (
              <Link
                key={child.id}
                href={child.path || "#"}
                className={cn(
                  "flex items-center py-2 px-3 rounded-md text-sm",
                  pathname === child.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                )}
                onClick={onSelect}
              >
                {child.icon && <MenuIcon name={child.icon} className="mr-2 h-4 w-4" />}
                {child.name}
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
