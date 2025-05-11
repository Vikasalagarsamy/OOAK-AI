"use client"

import { useState, useEffect, useCallback } from "react"
import type { MenuItemWithPermission } from "@/types/menu"

export function useMenu() {
  const [menu, setMenu] = useState<MenuItemWithPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching menu items...")

      // Add cache-busting parameter to prevent caching
      const response = await fetch(`/api/menu?t=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch menu: ${response.status}`)
      }

      const data = await response.json()
      console.log(`Fetched ${data.length} menu items`)

      setMenu(data)
      setLastRefresh(Date.now())
    } catch (err) {
      console.error("Error fetching menu:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setMenu([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshMenu = useCallback(async () => {
    // Clear session storage cache if it exists
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("userMenu")
    }

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
