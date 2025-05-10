"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { MenuItemWithPermission } from "@/types/menu"
import { MenuIcon } from "./menu-icon"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EnhancedMobileMenuProps {
  items: MenuItemWithPermission[]
}

export function EnhancedMobileMenu({ items }: EnhancedMobileMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="font-semibold">Menu</div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-4 pb-8">
            <nav className="flex flex-col space-y-1">
              {items.map((item) => (
                <MobileMenuItem key={item.id} item={item} pathname={pathname} onSelect={() => setOpen(false)} />
              ))}
            </nav>
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
  level?: number
}

function MobileMenuItem({ item, pathname, onSelect, level = 0 }: MobileMenuItemProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.path

  // Check if any child is active
  const isChildActive =
    hasChildren &&
    item.children.some(
      (child) =>
        pathname === child.path || (child.children?.some((grandchild) => pathname === grandchild.path) ?? false),
    )

  // Auto-expand if a child is active
  useState(() => {
    if (isChildActive) {
      setExpanded(true)
    }
  })

  // Skip items without view permission
  if (!item.permissions?.canView) return null

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
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {expanded && hasChildren && (
        <div className={cn("ml-4 mt-1 space-y-1 border-l pl-3", level > 0 && "ml-2")}>
          {item.children
            .filter((child) => child.permissions?.canView)
            .map((child) => (
              <MobileMenuItem key={child.id} item={child} pathname={pathname} onSelect={onSelect} level={level + 1} />
            ))}
        </div>
      )}
    </div>
  )
}
