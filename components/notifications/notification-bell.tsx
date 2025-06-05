"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bell, 
  BellRing, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle,
  X,
  Settings,
  MoreHorizontal
} from "lucide-react"
import type { Notification, NotificationType } from '@/types/notifications'
import { formatDistanceToNow } from 'date-fns'

interface NotificationBellProps {
  userId: number
  className?: string
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  overdue: <Clock className="h-4 w-4 text-red-500" />,
  approval_needed: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  payment_received: <DollarSign className="h-4 w-4 text-green-500" />,
  client_followup: <BellRing className="h-4 w-4 text-blue-500" />,
  automation: <CheckCircle className="h-4 w-4 text-purple-500" />,
  system: <Bell className="h-4 w-4 text-gray-500" />
}

const priorityColors = {
  low: 'bg-gray-100 border-gray-200',
  medium: 'bg-blue-50 border-blue-200',
  high: 'bg-yellow-50 border-yellow-200',
  urgent: 'bg-red-50 border-red-200 animate-pulse'
}

export function NotificationBell({ userId, className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 NotificationBell - Fetching notifications for userId:', userId, 'type:', typeof userId)
      const response = await fetch(`/api/notifications?user_id=${userId}`)
      console.log('🔍 NotificationBell - Response status:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 NotificationBell - Received data:', data)
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      } else {
        console.error('🔍 NotificationBell - Failed to fetch notifications:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('🔍 NotificationBell - Exception:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        if (!notifications.find(n => n.id === notificationId)?.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Set up polling for real-time updates
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [userId])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative ${className}`}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 max-h-96" 
        align="end"
        sideOffset={5}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" aria-label="Notification settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                    priorityColors[notification.priority]
                  } ${!notification.is_read ? 'font-medium' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {notification.action_label && (
                          <span className="text-xs text-blue-600 font-medium">
                            {notification.action_label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 