"use client"

import type React from "react"
import Link from "next/link"
import { LogoutButtonClient } from "./logout-button-client"
import { UserCircle } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { useCurrentUser } from "@/hooks/use-current-user"

export function Header({ children }: { children?: React.ReactNode }) {
  const [hasNotifications, setHasNotifications] = useState(true)
  const [notificationCount, setNotificationCount] = useState(3)
  const { setTheme } = useTheme()
  const { user, loading } = useCurrentUser()

  const viewNotifications = () => {
    setHasNotifications(false)
    setNotificationCount(0)
    // In a real app, you would mark notifications as read in the database
  }

  // Generate avatar initials from user data
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    return "AU" // Default fallback
  }

  // Get display name
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user?.username) {
      return user.username
    }
    return "Administrator" // Default fallback
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {children} {/* This will contain the mobile sidebar toggle button */}
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">Company Manager</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Link href="/dashboard" className="mr-4">
              Dashboard
            </Link>
            <div className="flex items-center">
              <UserCircle className="mr-1" />
              <LogoutButtonClient />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
