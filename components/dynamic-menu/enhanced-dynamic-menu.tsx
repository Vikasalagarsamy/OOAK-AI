"use client"

import { useEnhancedMenu } from "@/hooks/use-enhanced-menu"
import { EnhancedDesktopMenu } from "./enhanced-desktop-menu"
import { EnhancedMobileMenu } from "./enhanced-mobile-menu"
import { useMobile } from "@/hooks/use-mobile"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export function EnhancedDynamicMenu() {
  const { menuItems, isLoading, error, refreshMenu } = useEnhancedMenu()
  const isMobile = useMobile()

  // Log menu state for debugging
  useEffect(() => {
    console.log("EnhancedDynamicMenu rendered with:", {
      menuItemCount: menuItems.length,
      loading: isLoading,
      error,
    })
  }, [menuItems, isLoading, error])

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        {isMobile ? (
          <Skeleton className="h-10 w-10" />
        ) : (
          <>
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-[80px]" />
            <Skeleton className="h-10 w-[150px]" />
          </>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center">
        <div className="text-red-500 text-sm mr-2">Menu error. Please try refreshing.</div>
        <Button variant="outline" size="sm" onClick={refreshMenu}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {isMobile ? <EnhancedMobileMenu items={menuItems} /> : <EnhancedDesktopMenu items={menuItems} />}
      <Button variant="ghost" size="sm" onClick={refreshMenu} className="ml-2">
        <RefreshCw className="h-4 w-4" />
        <span className="sr-only">Refresh Menu</span>
      </Button>
    </div>
  )
}
