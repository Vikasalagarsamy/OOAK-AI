"use client"

import React from 'react'
import { menuManager } from '@/lib/menu-system'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LayoutDashboard,
  Building2,
  Users,
  BarChart,
  Settings,
  type LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Users,
  BarChart,
  Settings
}

function getIcon(iconName: string, className: string = 'h-5 w-5') {
  const IconComponent = iconMap[iconName] || Settings
  return <IconComponent className={className} />
}

export default function MenuDebugView() {
  const menu = menuManager.getMenuForUser({
    id: '1',
    username: 'admin',
    roles: ['admin'],
    permissions: ['admin', 'view', 'edit', 'delete'],
    isAdmin: true
  })

  return (
    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Menu Debug View</h2>
        {menu.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="flex items-center gap-2 font-medium">
              {getIcon(section.icon)} {section.name}
            </h3>
            <div className="ml-6 space-y-1">
              {section.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  {getIcon(item.icon)} {item.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
