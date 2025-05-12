"use client"

import { useEffect, useState } from "react"
import { Calendar, AlertCircle } from "lucide-react"

import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Type for notification data
interface Notification {
  id: number
  scheduledAt: string
  followupType: string
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
  followupType: string
  leadId: number
  leadNumber: string
  clientName: string
  summary?: string
  priority: string
  overdueDays: number
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
            // Show in-app toast notification
            toast({
              title: `Upcoming Follow-up: ${notification.clientName}`,
              description: `${notification.timeUntil} - ${notification.followupType.replace(/_/g, " ")}`,
              action: (
                <Button variant="outline" size="sm" onClick={() => router.push(`/follow-ups?id=${notification.id}`)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View
                </Button>
              ),
            })

            // Show browser notification if supported
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(`Upcoming Follow-up: ${notification.clientName}`, {
                body: `${notification.timeUntil} - ${notification.followupType.replace(/_/g, " ")}`,
                icon: "/favicon.ico",
              })
            }
          })
        }

        // Process overdue notifications
        if (data.overdue && data.overdue.length > 0 && data.overdue.length <= 3) {
          data.overdue.forEach((notification: OverdueNotification) => {
            // Show in-app toast notification for overdue
            toast({
              variant: "destructive",
              title: `Overdue Follow-up: ${notification.clientName}`,
              description: `Overdue by ${notification.overdueDays} day${notification.overdueDays !== 1 ? "s" : ""}`,
              action: (
                <Button variant="outline" size="sm" onClick={() => router.push(`/follow-ups?id=${notification.id}`)}>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  View
                </Button>
              ),
            })
          })
        } else if (data.overdue && data.overdue.length > 3) {
          // Show a summary toast for many overdue items
          toast({
            variant: "destructive",
            title: `${data.overdue.length} Overdue Follow-ups`,
            description: "You have multiple follow-ups that need attention",
            action: (
              <Button variant="outline" size="sm" onClick={() => router.push("/follow-ups?tab=overdue")}>
                <AlertCircle className="mr-2 h-4 w-4" />
                View All
              </Button>
            ),
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
