"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * FOLLOW-UP NOTIFICATIONS SYSTEM
 * 
 * Currently DISABLED to prevent fetch errors while database tables are being set up.
 * 
 * To re-enable notifications:
 * 1. Ensure lead_followups table exists and has proper structure
 * 2. Set ENABLE_NOTIFICATION_POLLING = true below
 * 3. Uncomment the database calls in app/api/follow-ups/notifications/route.ts
 * 
 * The system will then automatically:
 * - Poll for upcoming follow-ups every 5 minutes
 * - Show browser notifications (if permission granted)
 * - Display notifications in the bell icon dropdown
 */

// Feature flag to enable/disable notification polling
const ENABLE_NOTIFICATION_POLLING = false // Set to true when database is ready

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
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(3)

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
    if (!enabled || !ENABLE_NOTIFICATION_POLLING) {
      if (!ENABLE_NOTIFICATION_POLLING) {
        console.log("📢 Follow-up notifications are currently disabled. Enable ENABLE_NOTIFICATION_POLLING when database is ready.")
      }
      return
    }

    let retryTimeout: NodeJS.Timeout

    // Function to fetch notifications with enhanced error handling
    async function checkNotifications() {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch("/api/follow-ups/notifications?minutes=30", {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Reset retry count on successful fetch
        setRetryCount(0)

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
        console.log(`⚠️ Follow-up notification check failed (attempt ${retryCount + 1}/${maxRetries}):`, error instanceof Error ? error.message : error)
        
        setRetryCount(prev => prev + 1)
        
        // If we've exceeded max retries, stop trying for this session
        if (retryCount >= maxRetries - 1) {
          console.log("🚫 Follow-up notifications disabled for this session due to repeated failures. Please check database connectivity.")
          return
        }
        
        // Exponential backoff for retries
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000) // Max 30 seconds
        retryTimeout = setTimeout(checkNotifications, retryDelay)
      }
    }

    // Check immediately on mount if feature is enabled
    checkNotifications()

    // Set up polling interval (every 5 minutes) only if feature is enabled
    const interval = setInterval(checkNotifications, 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [enabled, router, retryCount, maxRetries])

  // This component doesn't render anything visible
  return null
}
