"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { MenuItemWithPermission } from "@/types/menu"
import { MenuIcon } from "./menu-icon"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

interface EnhancedDesktopMenuProps {
  items: MenuItemWithPermission[]
}

export function EnhancedDesktopMenu({ items }: EnhancedDesktopMenuProps) {
  const pathname = usePathname()

  // Check if a menu item or any of its children is active
  const isItemActive = (item: MenuItemWithPermission): boolean => {
    if (item.path === pathname) return true

    if (item.children && item.children.length > 0) {
      return item.children.some((child) => isItemActive(child))
    }

    return false
  }

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {items.map((item) => {
          // Skip items without view permission
          if (!item.permissions?.canView) return null

          const hasChildren = item.children && item.children.length > 0
          const active = isItemActive(item)

          // If the item has no children but has a path, render a simple link
          if (!hasChildren && item.path) {
            return (
              <NavigationMenuItem key={item.id}>
                <Link href={item.path} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      active && "bg-accent/50",
                    )}
                  >
                    {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
                    {item.name}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            )
          }

          // If the item has children, render a dropdown
          if (hasChildren) {
            // Filter out children without view permission
            const visibleChildren = item.children.filter((child) => child.permissions?.canView)

            if (visibleChildren.length === 0) return null

            return (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuTrigger className={active ? "bg-accent/50" : ""}>
                  {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
                  {item.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {visibleChildren.map((child) => (
                      <li key={child.id}>
                        <Link href={child.path || "#"} legacyBehavior passHref>
                          <NavigationMenuLink
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                              pathname === child.path && "bg-accent/50",
                            )}
                          >
                            <div className="flex items-center">
                              {child.icon && <MenuIcon name={child.icon} className="mr-2 h-4 w-4" />}
                              <div className="text-sm font-medium leading-none">{child.name}</div>
                            </div>
                            {child.description && (
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {child.description}
                              </p>
                            )}
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )
          }

          return null
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
