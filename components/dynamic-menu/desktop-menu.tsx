"use client"

import { usePathname } from "next/navigation"
import { useMenu } from "@/hooks/use-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface DesktopMenuProps {
  className?: string
}

export function DesktopMenu({ className }: DesktopMenuProps) {
  const { menu, loading, error } = useMenu()
  const pathname = usePathname()

  useEffect(() => {
    console.log("DesktopMenu rendered with:", { menu, loading, error })
  }, [menu, loading, error])

  return (
    <nav className={cn("hidden md:flex items-center space-x-4", className)}>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading menu...</div>
      ) : error ? (
        <div className="text-sm text-red-500">Error: {error}</div>
      ) : !menu || menu.length === 0 ? (
        <div className="text-sm text-yellow-500">No menu items</div>
      ) : (
        menu.map((item) => (
          <Link
            key={item.id}
            href={item.path || "#"}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.path ? "text-primary" : "text-muted-foreground",
            )}
          >
            {item.name}
          </Link>
        ))
      )}
    </nav>
  )
}
