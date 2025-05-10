"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { MenuItemWithPermission } from "@/types/menu"
import { MenuIcon } from "./menu-icon"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface EnhancedMobileMenuProps {
  items: MenuItemWithPermission[]
}

export function EnhancedMobileMenu({ items }: EnhancedMobileMenuProps) {
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
  const renderMenuItem = (item: MenuItemWithPermission, depth = 0) => {
    const active = isActive(item)
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openMenus[item.id] || active

    // Skip items without view permission
    if (!item.permissions.canView) {
      return null
    }

    return (
      <li key={item.id} className="w-full">
        <div className="flex flex-col w-full">
          {item.path ? (
            <div className="flex w-full">
              <Link
                href={item.path}
                className={cn(
                  "flex items-center flex-grow px-3 py-2.5 text-sm font-medium",
                  active && "bg-accent text-accent-foreground",
                  depth > 0 && "pl-6",
                )}
              >
                {item.icon && <MenuIcon name={item.icon} className="mr-2 h-5 w-5" />}
                <span>{item.name}</span>
              </Link>

              {hasChildren && (
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={cn("px-3 py-2.5", active && "bg-accent text-accent-foreground")}
                >
                  <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "transform rotate-180")} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => toggleMenu(item.id)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium",
                active && "bg-accent text-accent-foreground",
                depth > 0 && "pl-6",
              )}
            >
              <div className="flex items-center">
                {item.icon && <MenuIcon name={item.icon} className="mr-2 h-5 w-5" />}
                <span>{item.name}</span>
              </div>

              {hasChildren && (
                <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "transform rotate-180")} />
              )}
            </button>
          )}

          {/* Submenu */}
          {hasChildren && isOpen && (
            <ul className="border-l border-border ml-4 mt-1">
              {item.children.map((child) => renderMenuItem(child, depth + 1))}
            </ul>
          )}
        </div>
      </li>
    )
  }

  return (
    <nav className="w-full">
      <ul className="space-y-1 w-full">{items.map((item) => renderMenuItem(item))}</ul>
    </nav>
  )
}
