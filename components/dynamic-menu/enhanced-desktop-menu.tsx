"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { MenuItemWithPermission } from "@/types/menu"
import { MenuIcon } from "./menu-icon"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface EnhancedDesktopMenuProps {
  items: MenuItemWithPermission[]
}

export function EnhancedDesktopMenu({ items }: EnhancedDesktopMenuProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({})

  // Check if a menu item or any of its children is active
  const isActive = (item: MenuItemWithPermission): boolean => {
    if (item.path && pathname === item.path) {
      return true
    }

    if (item.children && item.children.length > 0) {
      return item.children.some((child) => isActive(child))
    }

    return false
  }

  // Toggle submenu open/closed
  const toggleMenu = (id: number) => {
    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Render a menu item
  const renderMenuItem = (item: MenuItemWithPermission) => {
    const active = isActive(item)
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openMenus[item.id] || active

    // Skip items without view permission
    if (!item.permissions.canView) {
      return null
    }

    return (
      <li key={item.id} className="relative">
        {item.path ? (
          <Link
            href={item.path}
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
              active && "bg-accent text-accent-foreground font-medium",
            )}
          >
            {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
            <span>{item.name}</span>
            {hasChildren && (
              <ChevronDown
                className={cn("ml-1 h-4 w-4 transition-transform", isOpen && "transform rotate-180")}
                onClick={(e) => {
                  e.preventDefault()
                  toggleMenu(item.id)
                }}
              />
            )}
          </Link>
        ) : (
          <button
            onClick={() => toggleMenu(item.id)}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
              active && "bg-accent text-accent-foreground font-medium",
            )}
          >
            {item.icon && <MenuIcon name={item.icon} className="mr-2 h-4 w-4" />}
            <span>{item.name}</span>
            {hasChildren && (
              <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", isOpen && "transform rotate-180")} />
            )}
          </button>
        )}

        {/* Submenu */}
        {hasChildren && isOpen && (
          <ul className="pl-6 mt-1 space-y-1">{item.children.map((child) => renderMenuItem(child))}</ul>
        )}
      </li>
    )
  }

  return (
    <nav className="px-2 py-2">
      <ul className="space-y-1">{items.map((item) => renderMenuItem(item))}</ul>
    </nav>
  )
}
