"use client"

import { useRouter } from "next/navigation"
import { Calendar, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: {
    id: string
    title: string
    description: string
    type?: string
    link?: string
    read: boolean
    createdAt: string
  }
  onMarkAsRead: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter()
  const isOverdue = notification.type === "overdue"
  const isUpcoming = notification.type === "upcoming"

  // Format the time
  const formattedTime = (() => {
    try {
      const date = new Date(notification.createdAt)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`

      return date.toLocaleDateString()
    } catch (e) {
      return "Recently"
    }
  })()

  const handleClick = () => {
    if (notification.link) {
      router.push(notification.link)
    }
    onMarkAsRead(notification.id)
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-2 rounded-md transition-colors hover:bg-muted cursor-pointer",
        !notification.read && "bg-muted/50",
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isOverdue ? (
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertCircle className="h-4 w-4" />
          </div>
        ) : isUpcoming ? (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="h-4 w-4" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <Info className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4
            className={cn("text-sm font-medium truncate", isOverdue && "text-red-600", isUpcoming && "text-blue-600")}
          >
            {notification.title}
          </h4>
          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{formattedTime}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
        {notification.link && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={(e) => {
                e.stopPropagation()
                router.push(notification.link!)
                onMarkAsRead(notification.id)
              }}
            >
              {isOverdue ? "View Overdue" : "View Details"}
            </Button>
          </div>
        )}
      </div>
      {!notification.read && <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />}
    </div>
  )
}
