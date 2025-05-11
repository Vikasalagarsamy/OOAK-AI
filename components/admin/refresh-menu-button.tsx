"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { refreshMenuCache } from "@/actions/refresh-menu-cache"
import { useToast } from "@/components/ui/use-toast"

export function RefreshMenuButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const result = await refreshMenuCache()

      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })

      // Force reload the page to ensure all components are refreshed
      if (result.success) {
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh menu cache",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="flex items-center gap-2">
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      Refresh Menu Cache
    </Button>
  )
}
