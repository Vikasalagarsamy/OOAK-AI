"use client"

import { useState, useEffect, useCallback } from "react"
import type { MenuItemWithPermission } from "@/types/menu"

export function useEnhancedMenu() {
  const [menu, setMenu] = useState<MenuItemWithPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/enhanced-menu")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch menu: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      // Ensure we have a valid array
      if (!Array.isArray(data.menu)) {
        setMenu([])
        throw new Error("Invalid menu data received")
      }

      setMenu(data.menu)
      setLastRefresh(Date.now())
    } catch (err) {
      console.error("Error fetching menu:", err)
      setError(err instanceof Error ? err.message : "Unknown error fetching menu")
      // Set empty array to prevent undefined errors
      setMenu([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  const refreshMenu = useCallback(async () => {
    await fetchMenu()
  }, [fetchMenu])

  return { menu, loading, error, refreshMenu, lastRefresh }
}
