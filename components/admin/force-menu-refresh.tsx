"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function ForceMenuRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Clear localStorage cache if it exists
      if (typeof window !== "undefined") {
        localStorage.removeItem("menu-cache")
        localStorage.removeItem("menu-timestamp")
        localStorage.removeItem("enhanced-menu-cache")
        localStorage.removeItem("enhanced-menu-timestamp")
      }

      // Force a hard refresh of the page
      router.refresh()

      // Wait a moment and then reload the page
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error("Error refreshing menu:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
      <h3 className="text-lg font-medium mb-2">Menu Cache Refresh</h3>
      <p className="text-sm text-gray-600 mb-4">
        If you&apos;re still seeing outdated menu items, click the button below to force a refresh of the menu cache.
      </p>
      <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-yellow-500 hover:bg-yellow-600 text-white">
        <RefreshCw className="h-4 w-4 mr-2" />
        {isRefreshing ? "Refreshing..." : "Force Menu Refresh"}
      </Button>
    </div>
  )
}
