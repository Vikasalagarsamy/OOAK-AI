"use client"

import { useEffect, useState } from "react"
import type { MenuItemWithPermission } from "@/types/menu"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MenuRendererProps {
  menuItems: MenuItemWithPermission[]
}

export function MenuRenderer({ menuItems }: MenuRendererProps) {
  const [topLevelItems, setTopLevelItems] = useState<MenuItemWithPermission[]>([])
  const [expandedItem, setExpandedItem] = useState<number | null>(null)
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    // Filter top-level items (those with no parent)
    const topLevel = menuItems.filter((item) => item.parentId === null && item.canView)
    setTopLevelItems(topLevel)

    console.log(
      "Top level menu items:",
      topLevel.map((i) => i.name),
    )
  }, [menuItems])

  // Function to get children of a menu item
  const getChildren = (parentId: number) => {
    return menuItems
      .filter((item) => item.parentId === parentId && item.canView)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  return (
    <div className="menu-container">
      {debugMode && (
        <pre className="text-xs mb-2 p-2 bg-muted rounded">
          {JSON.stringify(
            {
              totalItems: menuItems.length,
              topLevel: topLevelItems.length,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          )}
        </pre>
      )}

      <nav className="flex space-x-2">
        {topLevelItems.map((item) => (
          <div key={item.id} className="relative group">
            <button
              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              className="px-3 py-2 rounded hover:bg-accent flex items-center"
            >
              {item.name}
              {expandedItem === item.id ? (
                <ChevronDown className="ml-1 h-4 w-4" />
              ) : (
                <ChevronRight className="ml-1 h-4 w-4" />
              )}
            </button>

            {expandedItem === item.id && (
              <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-popover p-2 z-50">
                {getChildren(item.id).map((child) => (
                  <Link
                    key={child.id}
                    href={child.path || "#"}
                    className="block px-4 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)} className="ml-4">
        {debugMode ? "Hide Debug" : "Debug Menu"}
      </Button>
    </div>
  )
}
