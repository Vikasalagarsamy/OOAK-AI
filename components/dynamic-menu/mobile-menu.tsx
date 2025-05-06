"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMenu } from "@/hooks/use-menu"
import { MenuIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  className?: string
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const { menu, loading, error } = useMenu()
  const pathname = usePathname()

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
          <h2 className="text-lg font-semibold mb-4">Menu</h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading menu...</p>
          ) : error ? (
            <p className="text-sm text-red-500">Error: {error}</p>
          ) : !menu || menu.length === 0 ? (
            <p className="text-sm text-yellow-500">No menu items available</p>
          ) : (
            <div className="space-y-3">
              {menu.map((item) => (
                <div key={item.id} className="space-y-3">
                  <Link
                    href={item.path || "#"}
                    className={cn(
                      "block py-2 text-base font-medium",
                      pathname === item.path ? "text-primary" : "text-muted-foreground",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </Link>

                  {item.children && item.children.length > 0 && (
                    <div className="pl-4 space-y-1 border-l-2 border-muted">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.path || "#"}
                          className={cn(
                            "block py-1 text-sm",
                            pathname === child.path ? "text-primary" : "text-muted-foreground",
                          )}
                          onClick={() => setOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
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
