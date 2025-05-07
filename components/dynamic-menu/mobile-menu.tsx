"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMenu } from "@/hooks/use-menu"
import { MenuIcon, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MenuItemWithPermission } from "@/types/menu"

interface MobileMenuProps {
  className?: string
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const { menu, loading, error, refreshMenu } = useMenu()
  const pathname = usePathname()
  const [filteredMenu, setFilteredMenu] = useState<MenuItemWithPermission[]>([])

  useEffect(() => {
    console.log("MobileMenu rendered with:", {
      menuItems: menu?.length || 0,
      loading,
      error,
    })

    if (menu && menu.length > 0) {
      // Filter the menu to only include items with permissions
      const filtered = menu.filter((item) => {
        // Include if the item has a path or has children with paths
        return item.path || (item.children && item.children.some((child) => child.path))
      })

      setFilteredMenu(filtered)
    }
  }, [menu, loading, error])

  const handleRefresh = () => {
    refreshMenu()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("md:hidden", className)}>
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="p-6 space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            {(error || !filteredMenu || filteredMenu.length === 0) && (
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading menu...</p>
          ) : error ? (
            <p className="text-sm text-red-500">Error: {error}</p>
          ) : !filteredMenu || filteredMenu.length === 0 ? (
            <p className="text-sm text-yellow-500">No menu items available</p>
          ) : (
            <div className="space-y-3">
              {filteredMenu.map((item) => (
                <div key={item.id} className="space-y-3">
                  {item.path ? (
                    <Link
                      href={item.path}
                      className={cn(
                        "block py-2 text-base font-medium",
                        pathname === item.path || pathname.startsWith(item.path + "/")
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <div className="text-base font-medium text-muted-foreground">{item.name}</div>
                  )}

                  {item.children && item.children.length > 0 && (
                    <div className="pl-4 space-y-1 border-l-2 border-muted">
                      {item.children.map(
                        (child) =>
                          child.path && (
                            <Link
                              key={child.id}
                              href={child.path}
                              className={cn(
                                "block py-1 text-sm",
                                pathname === child.path || pathname.startsWith(child.path + "/")
                                  ? "text-primary"
                                  : "text-muted-foreground",
                              )}
                              onClick={() => setOpen(false)}
                            >
                              {child.name}
                            </Link>
                          ),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
