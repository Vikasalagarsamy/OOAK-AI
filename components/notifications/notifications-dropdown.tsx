"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { NotificationBell } from "./notification-bell"

export function NotificationsDropdown() {
  const { user, loading } = useCurrentUser()

  if (loading || !user) {
    return (
      <div className="w-9 h-9 bg-gray-100 animate-pulse rounded-md" />
    )
  }

  return (
    <NotificationBell 
      userId={typeof user.id === 'string' ? parseInt(user.id) : user.id || 1} 
      className=""
    />
  )
}
