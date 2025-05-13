"use client"

import { useState, useEffect } from "react"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/services/notification-service"
import type { Notification, NotificationState } from "@/types/notification"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function useNotifications() {
  const { user } = useCurrentUser()
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  })
  const supabase = createClient()

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return

    // Don't try to fetch if user ID isn't a valid UUID
    if (!isValidUUID(user.id)) {
      setState({
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
      })
      return
    }

    setState((prev) => ({ ...prev, loading: true }))
    try {
      const notifications = await getNotifications(user.id)

      // Transform snake_case database fields to camelCase for frontend use
      const formattedNotifications = notifications.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        read: n.read,
        createdAt: n.created_at,
        userId: n.user_id,
      }))

      const unreadCount = formattedNotifications.filter((n) => !n.read).length

      setState({
        notifications: formattedNotifications,
        unreadCount,
        loading: false,
        error: null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load notifications",
      }))
      console.error("Error loading notifications:", error)
    }
  }

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unreadCount: prev.unreadCount > 0 ? prev.unreadCount - 1 : 0,
      }))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id || !isValidUUID(user.id)) return

    try {
      await markAllNotificationsAsRead(user.id)
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return

    // Skip subscription setup for invalid UUID
    if (!isValidUUID(user.id)) return

    // Initial fetch
    fetchNotifications()

    // Set up subscription for real-time updates
    const subscription = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any

          // Transform snake_case to camelCase
          const newNotification: Notification = {
            id: newData.id,
            title: newData.title,
            message: newData.message,
            type: newData.type,
            link: newData.link,
            read: newData.read,
            createdAt: newData.created_at,
            userId: newData.user_id,
          }

          setState((prev) => ({
            ...prev,
            notifications: [newNotification, ...prev.notifications],
            unreadCount: prev.unreadCount + 1,
          }))

          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user?.id])

  return {
    ...state,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
