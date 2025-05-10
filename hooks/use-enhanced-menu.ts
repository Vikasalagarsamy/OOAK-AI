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
      const response = await fetch("/api/enhanced-menu")

      if (!response.ok) {
        throw new Error(`Error fetching menu: ${response.statusText}`)
      }

      const data = await response.json()

      // Check if the response has the expected structure
      if (data && Array.isArray(data.items)) {
        setMenuItems(data.items)
        setIsAuthenticated(data.isAuthenticated !== false)
      } else if (Array.isArray(data)) {
        // Handle case where the API returns an array directly
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
    fetchMenu()
  }, [fetchMenu])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  return { menuItems, isLoading, error, isAuthenticated, refreshMenu }
}
