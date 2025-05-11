"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { MenuItem } from "@/types/menu-item"
import { useRoleBasedMenu } from "@/hooks/use-role-based-menu"
import { ChevronDown, ChevronRight, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MenuIcon } from "@/components/dynamic-menu/menu-icon"

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const { mainNav, loading, error, isAdmin } = useRoleBasedMenu()
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (loading) {
    return (
      <div className={cn("flex flex-col space-y-4 px-4 py-2", className)}>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-[120px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))}
      </div>
    )
  }

  if (error) {
    return <div className="px-4 py-2 text-sm text-red-500">Error loading navigation. Please refresh the page.</div>
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isActive = pathname === item.path
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openItems[item.id]

    return (
      <div key={item.id} className={cn("flex flex-col", level > 0 && "ml-4")}>
        <div className="flex items-center">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm",
                isActive && "bg-accent text-accent-foreground font-medium",
                item.adminOnly && "text-red-500",
              )}
              onClick={() => toggleItem(item.id)}
            >
              <MenuIcon name={item.icon} className="h-4 w-4" />
              <span className="flex-grow">{item.name}</span>
              {item.badge && (
                <Badge variant={item.badge.variant} className="ml-2">
                  {item.badge.text}
                </Badge>
              )}
              {item.adminOnly && !item.badge && (
                <Badge variant="outline" className="ml-2">
                  Admin
                </Badge>
              )}
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <Link
              href={item.path}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm w-full rounded-md hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground font-medium",
                item.adminOnly && "text-red-500",
              )}
            >
              <MenuIcon name={item.icon} className="h-4 w-4" />
              <span className="flex-grow">{item.name}</span>
              {item.badge && (
                <Badge variant={item.badge.variant} className="ml-2">
                  {item.badge.text}
                </Badge>
              )}
              {item.adminOnly && !item.badge && (
                <Badge variant="outline" className="ml-2">
                  Admin
                </Badge>
              )}
            </Link>
          )}
        </div>

        {hasChildren && isOpen && (
          <div className="mt-1 border-l-2 border-muted pl-2">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {isAdmin && (
        <div className="mb-2 px-2 py-1.5 text-xs font-semibold flex items-center gap-2 bg-red-50 text-red-800 rounded-md">
          <Shield className="h-3 w-3" />
          Administrator Access
        </div>
      )}

      {mainNav.map((item) => renderMenuItem(item))}

      {mainNav.length === 0 && (
        <div className="px-2 py-4 text-sm text-muted-foreground text-center">No menu items available for your role</div>
      )}
    </nav>
  )
}
