"use client"

import { useState, useEffect, useCallback } from "react"
import type { MenuItemWithPermission } from "@/types/menu"

// Function to fetch the menu from the API
async function fetchMenu() {
  try {
    console.log("Fetching menu from API")
    const response = await fetch("/api/menu", {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      // Add a timestamp to prevent caching
      cache: "no-store",
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

// Function to fetch the current user's role
async function fetchUserRole() {
  try {
    const response = await fetch("/api/auth/status", {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      // Add a timestamp to prevent caching
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user status: ${response.status}`)
    }

    const data = await response.json()
    return data.user?.roleId || null
  } catch (error) {
    console.error("Error fetching user role:", error)
    return null
  }
}

// Hook for using the menu in components
export function useMenu() {
  const [menu, setMenu] = useState<MenuItemWithPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null)

  // Memoize the loadMenu function to prevent unnecessary re-renders
  const loadMenu = useCallback(async () => {
    try {
      setLoading(true)
      console.log("Loading menu data...")
      const data = await fetchMenu()
      console.log("Setting menu data in state:", data)
      setMenu(data)
      setError(null)
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load menu"
      console.error("Error in useMenu hook:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Check for role changes
  const checkRoleChanges = useCallback(async () => {
    try {
      const roleId = await fetchUserRole()
      if (roleId !== currentRoleId) {
        console.log(`Role changed from ${currentRoleId} to ${roleId}, refreshing menu`)
        setCurrentRoleId(roleId)
        return true
      }
      return false
    } catch (err) {
      console.error("Error checking role changes:", err)
      return false
    }
  }, [currentRoleId])

  useEffect(() => {
    let isMounted = true
    console.log("useMenu hook initialized")

    // Load menu immediately
    loadMenu()

    // Also check for role changes
    checkRoleChanges()

    // Set up a refresh interval (every 5 seconds)
    const refreshInterval = setInterval(async () => {
      if (!isMounted) return

      console.log("Checking for role changes...")
      const roleChanged = await checkRoleChanges()

      if (roleChanged) {
        console.log("Role changed, refreshing menu data...")
        loadMenu()
      }
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(refreshInterval)
    }
  }, [loadMenu, checkRoleChanges])

  // Force refresh when role changes
  useEffect(() => {
    if (currentRoleId !== null) {
      loadMenu()
    }
  }, [currentRoleId, loadMenu])

  return { menu, loading, error, refreshMenu: loadMenu }
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
