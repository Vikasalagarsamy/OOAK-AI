"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { DesktopMenu } from "./desktop-menu"
import { MobileMenu } from "./mobile-menu"
import { useMenu } from "@/hooks/use-menu"
import { Button } from "@/components/ui/button"
import { useRole } from "@/contexts/role-context"

export function DynamicMenu({ className }: { className?: string }) {
  const { refreshMenu } = useMenu()
  const { currentRole } = useRole()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Add console log to check if component is rendering
  useEffect(() => {
    console.log("DynamicMenu component mounted")
  }, [])

  // Refresh menu when role changes
  useEffect(() => {
    refreshMenu()
  }, [currentRole, refreshMenu])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshMenu()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500) // Show spinner for at least 500ms
    }
  }

  return (
    <div className="flex items-center">
      <DesktopMenu className={className} />
      <MobileMenu className={className} />
      <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-2" disabled={isRefreshing}>
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="sr-only">Refresh Menu</span>
      </Button>
    </div>
  )
}
