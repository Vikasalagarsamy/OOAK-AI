"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function NotificationGenerator() {
  const [loading, setLoading] = useState(false)

  const generateNotification = async () => {
    setLoading(true)

    try {
      // In a real app, this would call an API endpoint to create a notification
      // For now, we'll just show a toast to indicate success
      toast({
        title: "Notification generated",
        description: "A test notification has been added to your bell icon",
      })

      // Simulate adding a notification to the global state
      // In a real implementation, this would be handled by your notification system
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate notification",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={generateNotification} disabled={loading} variant="outline" size="sm">
      Generate Test Notification
    </Button>
  )
}
