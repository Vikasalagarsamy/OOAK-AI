"use client"

import { useState } from "react"
import type { MenuItemWithChildren } from "@/types/menu-permissions"
import { ChevronDown, ChevronRight } from "lucide-react"

interface MenuStructureViewerProps {
  menuItems: MenuItemWithChildren[]
  onSelectMenuItem: (menuItemId: number) => void
}

export function MenuStructureViewer({ menuItems, onSelectMenuItem }: MenuStructureViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Menu Structure</h2>
      <div className="space-y-2">
        {menuItems.map((item) => (
          <MenuItem key={item.id} item={item} level={0} onSelectMenuItem={onSelectMenuItem} />
        ))}
      </div>
    </div>
  )
}

interface MenuItemProps {
  item: MenuItemWithChildren
  level: number
  onSelectMenuItem: (menuItemId: number) => void
}

function MenuItem({ item, level, onSelectMenuItem }: MenuItemProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = item.children.length > 0

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer ${level > 0 ? "ml-4" : ""}`}
        onClick={() => onSelectMenuItem(item.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded()
            }}
            className="mr-2"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        <div className="flex-1">
          <span className="font-medium">{item.name}</span>
          {item.path && <span className="text-gray-500 ml-2 text-sm">({item.path})</span>}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="ml-4 space-y-2">
          {item.children.map((child) => (
            <MenuItem key={child.id} item={child} level={level + 1} onSelectMenuItem={onSelectMenuItem} />
          ))}
        </div>
      )}
    </div>
  )
}
