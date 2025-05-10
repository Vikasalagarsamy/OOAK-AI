"use client"

import { useState, useEffect, useCallback } from "react"
import type { MenuItemWithPermission } from "@/types/menu"
import { useRouter } from "next/navigation"

// Hook for using the enhanced menu in components
export function useEnhancedMenu() {
  const [menu, setMenu] = useState<MenuItemWithPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number>(0)
  const router = useRouter()

  // Function to load the menu with cache-busting
  const loadMenu = useCallback(async () => {
    try {
      setLoading(true)
      console.log("Loading enhanced menu data...")

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/enhanced-menu?t=${timestamp}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch menu: ${response.status}`)
      }

      const data = await response.json()
      console.log("Setting enhanced menu data in state:", data)
      setMenu(data)
      setError(null)
      setLastRefresh(Date.now())
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load menu"
      console.error("Error in useEnhancedMenu hook:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Force refresh function that can be called from outside
  const forceRefresh = useCallback(async () => {
    console.log("Force refreshing enhanced menu...")
    await loadMenu()
    // Also refresh the page to ensure all components update
    router.refresh()
  }, [loadMenu, router])

  useEffect(() => {
    let isMounted = true
    console.log("useEnhancedMenu hook initialized")

    // Load menu immediately
    loadMenu()

    // Set up a refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      if (!isMounted) return

      if (Date.now() - lastRefresh > 30000) {
        console.log("Periodic enhanced menu refresh...")
        loadMenu()
      }
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(refreshInterval)
    }
  }, [loadMenu, lastRefresh])

  return { menu, loading, error, refreshMenu: forceRefresh }
}
