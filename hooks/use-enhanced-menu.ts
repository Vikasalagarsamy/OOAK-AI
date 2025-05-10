"use client"

import { useState, useEffect } from "react"

interface MenuItem {
  id: number
  name: string
  path: string
  icon?: string
  parentId?: number | null
  sortOrder?: number
}

export function useEnhancedMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMenu() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/enhanced-menu")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch menu")
        }

        setMenuItems(data.items || [])
        setError(null)
      } catch (err) {
        console.error("Error fetching menu:", err)
        setError(err instanceof Error ? err.message : "Failed to load menu")
        setMenuItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  return { menuItems, isLoading, error }
}
