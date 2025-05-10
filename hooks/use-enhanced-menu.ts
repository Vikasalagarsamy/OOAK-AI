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
  // Initialize with empty array to prevent undefined
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMenu() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/enhanced-menu")

        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.status}`)
        }

        const data = await response.json()

        // Ensure we have a valid array
        if (!data || !Array.isArray(data.items)) {
          console.warn("Invalid menu data format:", data)
          setMenuItems([]) // Set empty array as fallback
        } else {
          setMenuItems(data.items)
        }

        setError(null)
      } catch (err) {
        console.error("Error fetching menu:", err)
        setError(err instanceof Error ? err.message : "Failed to load menu")
        setMenuItems([]) // Set empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  return { menuItems, isLoading, error }
}
