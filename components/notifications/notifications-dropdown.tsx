"use client"

import { Fragment, useState } from "react"
import { Bell, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationItem } from "./notification-item"
import { cn } from "@/lib/utils"

// Sample notifications for testing
const sampleNotifications = [
  {
    id: "sample-1",
    title: "Overdue Follow-up: Client ABC",
    description: "Overdue by 3 days - Phone Call",
    type: "overdue",
    link: "/follow-ups?id=123",
    read: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sample-2",
    title: "Upcoming Follow-up: Client XYZ",
    description: "In 2 hours - Email",
    type: "upcoming",
    link: "/follow-ups?id=456",
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sample-3",
    title: "New Lead Assigned",
    description: "A new lead has been assigned to you",
    type: "info",
    link: "/sales/my-leads",
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(sampleNotifications)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Function to mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // Function to refresh notifications
  const refreshNotifications = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setNotifications(sampleNotifications)
      setLoading(false)
    }, 1000)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={refreshNotifications} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <ScrollArea className="h-[calc(100vh-200px)] max-h-80">
            {loading ? (
              <div className="space-y-3 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Failed to load notifications</p>
                <Button variant="link" className="mt-2" onClick={refreshNotifications}>
                  Retry
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No notifications available</p>
                <p className="text-xs text-muted-foreground mt-1">You'll see notifications here when they arrive</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {notifications.map((notification) => (
                  <Fragment key={notification.id}>
                    <NotificationItem notification={notification} onMarkAsRead={markAsRead} />
                    <DropdownMenuSeparator
                      className={cn(
                        "my-1",
                        notifications.indexOf(notification) === notifications.length - 1 ? "hidden" : "",
                      )}
                    />
                  </Fragment>
                ))}
              </div>
            )}
          </ScrollArea>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
