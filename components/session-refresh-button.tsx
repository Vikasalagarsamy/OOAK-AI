"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function SessionRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

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
          variant: "default",
        })

        // Refresh the current page to apply new permissions
        router.refresh()
      } else {
        toast({
          title: "Refresh Failed",
          description: data.error || "Failed to refresh session. Please try logging out and back in.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      toast({
        title: "Refresh Failed",
        description: "An error occurred while refreshing your session.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
      Refresh Session
    </Button>
  )
}
