"use client"

import { useState, useEffect } from "react"
import type { MenuItemWithPermission } from "@/types/menu"

// Function to fetch the menu from the API
async function fetchMenu() {
  try {
    console.log("Fetching menu from API")
    const response = await fetch("/api/menu", {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch menu: ${response.status}`, errorText)
      throw new Error(`Failed to fetch menu: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Menu data received:", data)
    return data
  } catch (error) {
    console.error("Error fetching menu:", error)
    throw error
  }
}

// Hook for using the menu in components
export function useMenu() {
  const [menu, setMenu] = useState<MenuItemWithPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    console.log("useMenu hook initialized")

    async function loadMenu() {
      try {
        setLoading(true)
        console.log("Loading menu data...")
        const data = await fetchMenu()

        if (isMounted) {
          console.log("Setting menu data in state:", data)
          setMenu(data)
          setError(null)
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMessage = err.message || "Failed to load menu"
          console.error("Error in useMenu hook:", errorMessage)
          setError(errorMessage)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Load menu immediately
    loadMenu()

    // Set up a refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      console.log("Refreshing menu data...")
      loadMenu()
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(refreshInterval)
    }
  }, [])

  return { menu, loading, error }
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
        const response = await fetch(`/api/permissions?path=${encodeURIComponent(path)}`)

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
