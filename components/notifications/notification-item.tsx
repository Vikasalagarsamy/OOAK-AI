"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { AlertCircle, CheckCircle2, Info, ExternalLink, XCircle } from "lucide-react"
import type { Notification } from "@/types/notification"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => Promise<void>
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    if (notification.read) return

    e.preventDefault()
    e.stopPropagation()

    setIsLoading(true)
    await onMarkAsRead(notification.id)
    setIsLoading(false)
  }

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const Content = () => (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-md transition-colors",
        notification.read ? "bg-transparent" : "bg-muted/40",
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
      </div>
    </div>
  )

  return (
    <div className="relative">
      {notification.link ? (
        <Link
          href={notification.link}
          className="block hover:bg-accent/50 rounded-md transition-colors"
          onClick={notification.read ? undefined : handleMarkAsRead}
        >
          <Content />
          {notification.link && (
            <div className="absolute bottom-2 right-3">
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </Link>
      ) : (
        <div className="hover:bg-accent/50 rounded-md transition-colors">
          <Content />
        </div>
      )}

      {!notification.read && (
        <div className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full" aria-hidden="true" />
      )}
    </div>
  )
}
