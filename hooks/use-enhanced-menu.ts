"use client"

import { useState, useEffect, useCallback } from "react"
import type { MenuItemWithPermission } from "@/types/menu"

export function useEnhancedMenu() {
  const [menuItems, setMenuItems] = useState<MenuItemWithPermission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchMenu = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Fetching enhanced menu...")
      const response = await fetch("/api/enhanced-menu", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        credentials: "include", // Important: include credentials for auth
      })

      if (!response.ok) {
        console.error("Menu fetch failed:", response.status, response.statusText)
        throw new Error(`Error fetching menu: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Menu data received:", data)

      // Check if the response has the expected structure
      if (data && Array.isArray(data.items)) {
        console.log("Setting menu items from data.items:", data.items.length, "items")
        setMenuItems(data.items)
        setIsAuthenticated(data.isAuthenticated !== false)
      } else if (Array.isArray(data)) {
        console.log("Setting menu items from direct array:", data.length, "items")
        setMenuItems(data)
        setIsAuthenticated(true)
      } else {
        console.error("Unexpected menu data format:", data)
        setMenuItems([])
        setError("Invalid menu data format")
      }
    } catch (err) {
      console.error("Error fetching menu:", err)
      setError(err instanceof Error ? err.message : "Failed to load menu")
      setMenuItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshMenu = useCallback(() => {
    console.log("Refreshing menu...")
    return fetchMenu()
  }, [fetchMenu])

  useEffect(() => {
    console.log("Initial menu fetch...")
    fetchMenu()
  }, [fetchMenu])

  return { menuItems, isLoading, error, isAuthenticated, refreshMenu }
}
