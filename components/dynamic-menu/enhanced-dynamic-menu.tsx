"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEnhancedMenu } from "@/hooks/use-enhanced-menu"
import { EnhancedDesktopMenu } from "./enhanced-desktop-menu"
import { EnhancedMobileMenu } from "./enhanced-mobile-menu"

export function EnhancedDynamicMenu({ className }: { className?: string }) {
  const { menu, loading, error, refreshMenu } = useEnhancedMenu()

  // Log menu state for debugging
  useEffect(() => {
    console.log("EnhancedDynamicMenu rendered with:", {
      menuItemCount: menu.length,
      loading,
      error,
    })
  }, [menu, loading, error])

  return (
    <div className="flex items-center">
      <EnhancedDesktopMenu menu={menu} loading={loading} className={className} />
      <EnhancedMobileMenu menu={menu} loading={loading} className={className} />
      <Button variant="ghost" size="sm" onClick={refreshMenu} className="ml-2">
        <RefreshCw className="h-4 w-4" />
        <span className="sr-only">Refresh Menu</span>
      </Button>
    </div>
  )
}
