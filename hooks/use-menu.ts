"use client"

import { useState, useEffect, useCallback } from "react"
import type { MenuItemWithPermission } from "@/types/menu"

export function useMenu() {
  const [menu, setMenu] = useState<MenuItemWithPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Use the same API endpoint that the main navigation uses
      const response = await fetch("/api/menu", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Error fetching menu: ${response.statusText}`)
      }

      const data = await response.json()
      setMenu(data)
      setLastRefresh(Date.now())
    } catch (err) {
      console.error("Error fetching menu:", err)
      setError(err instanceof Error ? err.message : "Failed to load menu")
      setMenu([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshMenu = useCallback(() => {
    return fetchMenu()
  }, [fetchMenu])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  return { menu, loading, error, refreshMenu, lastRefresh }
}

// Hook to check if the current user has specific permissions for a path
export function usePermissions(path: string) {
  const [permissions, setPermissions] = useState({
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadPermissions() {
      if (!path) return

      try {
        setLoading(true)
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/permissions?path=${encodeURIComponent(path)}&t=${timestamp}`, {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch permissions: ${response.status}`)
        }

        const data = await response.json()

        if (isMounted) {
          setPermissions(data)
        }
      } catch (error) {
        console.error("Error fetching permissions:", error)
        if (isMounted) {
          setPermissions({
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPermissions()

    return () => {
      isMounted = false
    }
  }, [path])

  return { permissions, loading }
}
