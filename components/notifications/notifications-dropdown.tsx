"use client"

import { Fragment } from "react"
import { Bell } from "lucide-react"
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
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import {
  useGlobalNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../follow-ups/follow-up-notification-listener"

export function NotificationsDropdown() {
  const {
    notifications: apiNotifications,
    unreadCount: apiUnreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  // Get follow-up notifications from global state
  const followUpNotifications = useGlobalNotifications()

  // Combine both types of notifications
  const allNotifications = [...followUpNotifications, ...apiNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const unreadCount = allNotifications.filter((n) => !n.read).length

  // Handle marking a notification as read
  const handleMarkAsRead = (id: string) => {
    // Check if it's a follow-up notification
    const isFollowUp = followUpNotifications.some((n) => n.id === id)
    if (isFollowUp) {
      markNotificationAsRead(id)
    } else {
      markAsRead(id)
    }
  }

  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead()
    markAllAsRead()
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
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <ScrollArea className="h-[calc(100vh-200px)] max-h-80">
            {loading && apiNotifications.length === 0 ? (
              <div className="space-y-3 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error && apiNotifications.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Failed to load notifications</p>
                <Button variant="link" className="mt-2" onClick={() => {}}>
                  Retry
                </Button>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications available</div>
            ) : (
              <div className="space-y-1 p-1">
                {allNotifications.map((notification) => (
                  <Fragment key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={() => handleMarkAsRead(notification.id)}
                    />
                    <DropdownMenuSeparator
                      className={cn(
                        "my-1",
                        allNotifications.indexOf(notification) === allNotifications.length - 1 ? "hidden" : "",
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
