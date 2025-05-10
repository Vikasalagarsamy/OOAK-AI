"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { useMenu } from "@/hooks/use-menu"
import { Button } from "@/components/ui/button"
import { MenuRenderer } from "./menu-renderer"

export function DynamicMenu({ className }: { className?: string }) {
  const { menu, loading, error, refreshMenu } = useMenu()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Add console log to check if component is rendering
  useEffect(() => {
    console.log("DynamicMenu component mounted")
    console.log("Initial menu items:", menu.length)
  }, [menu.length])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshMenu()
      console.log("Menu refreshed, new count:", menu.length)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500) // Show spinner for at least 500ms
    }
  }

  if (loading) {
    return <div>Loading menu...</div>
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading menu: {error}
        <Button onClick={handleRefresh} className="ml-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center ${className}`}>
      <MenuRenderer menuItems={menu} />
      <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-2" disabled={isRefreshing}>
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="sr-only">Refresh Menu</span>
      </Button>
    </div>
  )
}
