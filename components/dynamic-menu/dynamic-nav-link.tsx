"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MenuIcon } from "./menu-icon"
import type { MenuItemWithPermission } from "@/types/menu"
import { NavigationMenuLink } from "@/components/ui/navigation-menu"

interface DynamicNavLinkProps {
  item: MenuItemWithPermission
  className?: string
  onClick?: () => void
}

export function DynamicNavLink({ item, className, onClick }: DynamicNavLinkProps) {
  const pathname = usePathname()
  const isActive = item.path ? pathname === item.path : false

  if (!item.permissions.canView) {
    return null
  }

  return (
    <Link href={item.path || "#"} legacyBehavior passHref>
      <NavigationMenuLink
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          className,
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          {item.icon && <MenuIcon name={item.icon} className="h-4 w-4" />}
          <div className="text-sm font-medium leading-none">{item.name}</div>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{item.description}</p>
        )}
      </NavigationMenuLink>
    </Link>
  )
}
