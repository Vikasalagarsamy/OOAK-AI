"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, LogOut, Settings, User, Moon, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { MobileNavigation } from "./mobile-navigation"
import { Badge } from "./ui/badge"
import { useTheme } from "next-themes"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Skeleton } from "./ui/skeleton"

export function Header() {
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
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <MobileNavigation />
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">ONE OF A KIND PORTAL</span>
          </Link>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme("dark")}
            className="h-9 w-9"
            aria-label="Toggle theme"
          >
            <Moon className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/abstract-geometric-shapes.png" alt="User avatar" />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {loading ? (
                <div className="flex flex-col space-y-2 p-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <div className="flex flex-col space-y-1 p-2">
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{getDisplayName()}</p>
                    {user?.isAdmin && (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                  <p className="text-xs text-muted-foreground">Role: {user?.roleName || "User"}</p>
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/auth/logout" className="flex w-full items-center text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
