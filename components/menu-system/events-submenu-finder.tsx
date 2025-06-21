"use client"

import React from 'react'
import { menuManager } from '@/lib/menu-system'

export default function EventsSubmenuFinder() {
  const menu = menuManager.getMenuForUser({
    id: '1',
    username: 'admin',
    roles: ['admin'],
    permissions: ['admin', 'view', 'edit', 'delete'],
    isAdmin: true
  })

  const eventsSection = menu.find(section => section.id === 'events')
  const eventsItems = eventsSection?.items || []

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Events Menu Items</h2>
      <div className="space-y-2">
        {eventsItems.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            <span className="text-sm text-muted-foreground">({item.path})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
