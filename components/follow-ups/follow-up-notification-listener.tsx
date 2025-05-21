"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Type for notification data
interface Notification {
  id: number
  scheduledAt: string
  contactMethod: string
  leadId: number
  leadNumber: string
  clientName: string
  summary?: string
  priority: string
  timeUntil: string
}

interface OverdueNotification {
  id: number
  scheduledAt: string
  contactMethod: string
  leadId: number
  leadNumber: string
  clientName: string
  summary?: string
  priority: string
  overdueDays: number
}

// Global state to store notifications
export type NotificationItem = {
  id: string
  title: string
  description: string
  type: "upcoming" | "overdue"
  link: string
  read: boolean
  createdAt: string
}

// Create a global store for notifications that can be accessed by the bell icon dropdown
let globalNotifications: NotificationItem[] = []
let notificationListeners: (() => void)[] = []

export function addNotification(notification: NotificationItem) {
  globalNotifications = [notification, ...globalNotifications]
  notificationListeners.forEach((listener) => listener())
}

export function markNotificationAsRead(id: string) {
  globalNotifications = globalNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  notificationListeners.forEach((listener) => listener())
}

export function markAllNotificationsAsRead() {
  globalNotifications = globalNotifications.map((n) => ({ ...n, read: true }))
  notificationListeners.forEach((listener) => listener())
}

export function useGlobalNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(globalNotifications)

  useEffect(() => {
    const updateNotifications = () => {
      setNotifications([...globalNotifications])
    }

    notificationListeners.push(updateNotifications)
    return () => {
      notificationListeners = notificationListeners.filter((listener) => listener !== updateNotifications)
    }
  }, [])

  return notifications
}

export function FollowUpNotificationListener() {
  const router = useRouter()
  const [enabled, setEnabled] = useState(true)

  // Check for browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setEnabled(true)
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          setEnabled(permission === "granted")
        })
      }
    }
  }, [])

  // Poll for notifications
  useEffect(() => {
    if (!enabled) return

    // Function to fetch notifications
    async function checkNotifications() {
      try {
        const response = await fetch("/api/follow-ups/notifications?minutes=30")

        if (!response.ok) {
          throw new Error("Failed to fetch notifications")
        }

        const data = await response.json()

        // Process upcoming notifications
        if (data.upcoming && data.upcoming.length > 0) {
          data.upcoming.forEach((notification: Notification) => {
            // Add to global notifications
            const notificationId = `upcoming-${notification.id}-${Date.now()}`
            addNotification({
              id: notificationId,
              title: `Upcoming Follow-up: ${notification.clientName}`,
              description: `${notification.timeUntil} - ${notification.contactMethod.replace(/_/g, " ")}`,
              type: "upcoming",
              link: `/follow-ups?id=${notification.id}`,
              read: false,
              createdAt: new Date().toISOString(),
            })

            // Show browser notification if supported
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(`Upcoming Follow-up: ${notification.clientName}`, {
                body: `${notification.timeUntil} - ${notification.contactMethod.replace(/_/g, " ")}`,
                icon: "/favicon.ico",
              })
            }
          })
        }

        // Process overdue notifications
        if (data.overdue && data.overdue.length > 0) {
          data.overdue.forEach((notification: OverdueNotification) => {
            // Add to global notifications
            const notificationId = `overdue-${notification.id}-${Date.now()}`
            addNotification({
              id: notificationId,
              title: `Overdue Follow-up: ${notification.clientName}`,
              description: `Overdue by ${notification.overdueDays} day${notification.overdueDays !== 1 ? "s" : ""}`,
              type: "overdue",
              link: `/follow-ups?id=${notification.id}`,
              read: false,
              createdAt: new Date().toISOString(),
            })
          })
        }
      } catch (error) {
        console.error("Error checking notifications:", error)
      }
    }

    // Check immediately on mount
    checkNotifications()

    // Set up polling interval (every 5 minutes)
    const interval = setInterval(checkNotifications, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [enabled, router])

  // This component doesn't render anything visible
  return null
}
