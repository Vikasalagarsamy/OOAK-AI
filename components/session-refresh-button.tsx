"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function SessionRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/auth/refresh-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Session Refreshed",
          description: "Your session has been refreshed with the latest permissions.",
        })

        // Force reload the page to apply new permissions
        window.location.reload()
      } else {
        toast({
          title: "Refresh Failed",
          description: data.error || "Failed to refresh session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      toast({
        title: "Refresh Failed",
        description: "An error occurred while refreshing your session",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-1">
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      <span>Refresh Session</span>
    </Button>
  )
}
