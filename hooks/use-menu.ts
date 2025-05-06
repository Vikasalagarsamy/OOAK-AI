"use client"

import { useState, useEffect } from "react"
import type { MenuItemWithPermission } from "@/types/menu"

// Function to fetch the menu from the API
async function fetchMenu() {
  try {
    const response = await fetch("/api/menu")
    if (!response.ok) {
      throw new Error(`Failed to fetch menu: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching menu:", error)
    return []
  }
}

// Hook for using the menu in components
export function useMenu() {
  const [menu, setMenu] = useState<MenuItemWithPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadMenu() {
      try {
        setLoading(true)
        const data = await fetchMenu()

        if (isMounted) {
          setMenu(data)
          setError(null)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load menu")
          console.error(err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMenu()

    return () => {
      isMounted = false
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
