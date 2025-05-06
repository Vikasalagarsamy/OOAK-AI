"use client"

import { usePathname } from "next/navigation"
import { useMenu } from "@/hooks/use-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MenuIcon } from "./menu-icon"
import type { MenuItemWithPermission } from "@/types/menu"
import { Skeleton } from "@/components/ui/skeleton"
import React from "react"

interface DesktopMenuProps {
  className?: string
}

export function DesktopMenu({ className }: DesktopMenuProps) {
  const { menu, loading, error } = useMenu()
  const pathname = usePathname()

  if (loading) {
    return (
      <div className={cn("hidden md:flex", className)}>
        <Skeleton className="h-10 w-[400px]" />
      </div>
    )
  }

  if (error || !menu || menu.length === 0) {
    return null
  }

  // Filter out menu items with no children and no path (these would be useless dividers)
  const filteredMenu = menu.filter((item) => (item.children && item.children.length > 0) || item.path)

  return (
    <NavigationMenu className={cn("hidden md:flex", className)}>
      <NavigationMenuList>
        {filteredMenu.map((item) => (
          <MenuItem key={item.id} item={item} pathname={pathname} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
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

interface MenuItemProps {
  item: MenuItemWithPermission
  pathname: string
  depth?: number
}

function MenuItem({ item, pathname, depth = 0 }: MenuItemProps) {
  // Skip items the user doesn't have permission to view
  if (!item.permissions.canView) {
    return null
  }

  const active = isActive(item.path, pathname)

  // If this item has no children or path is null (e.g. divider/category), just render a link
  if ((!item.children || item.children.length === 0) && item.path) {
    return (
      <NavigationMenuItem>
        <Link href={item.path} legacyBehavior passHref>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} active={active}>
            {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
            {item.name}
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    )
  }

  // Skip this item if it has no children AND no path (useless menu item)
  if ((!item.children || item.children.length === 0) && !item.path) {
    return null
  }

  // Filter children that user has permission to view
  const visibleChildren = item.children?.filter((child) => child.permissions.canView) || []

  // If there are no visible children and no path, skip this item
  if (visibleChildren.length === 0 && !item.path) {
    return null
  }

  // If it has children, render a dropdown
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={active ? "bg-accent" : ""}>
        {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
        {item.name}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
          {item.path && (
            <li className="row-span-3">
              <Link href={item.path} legacyBehavior passHref>
                <NavigationMenuLink
                  className={cn(
                    "flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md",
                    active ? "from-accent/50 to-accent" : "",
                  )}
                >
                  <div className="mb-2 mt-4 text-lg font-medium">{item.name} Overview</div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    {item.description || `View ${item.name} dashboard and overview`}
                  </p>
                </NavigationMenuLink>
              </Link>
            </li>
          )}

          {visibleChildren.map((child) => (
            <ListItem
              key={child.id}
              title={child.name}
              href={child.path || "#"}
              icon={child.icon}
              active={isActive(child.path, pathname)}
            >
              {child.description}
            </ListItem>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    title: string
    icon?: string
    active?: boolean
  }
>(({ className, title, children, icon, active, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            active ? "bg-accent text-accent-foreground" : "",
            className,
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
            {icon && <MenuIcon name={icon} className="h-4 w-4" />}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
