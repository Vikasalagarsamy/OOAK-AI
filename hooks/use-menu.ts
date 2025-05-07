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

// Function to fetch the current user's role
async function fetchUserRole() {
  try {
    const response = await fetch("/api/auth/status", {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
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

  useEffect(() => {
    let isMounted = true
    console.log("useMenu hook initialized")

    // Check for role changes
    const checkRoleChanges = async () => {
      try {
        const roleId = await fetchUserRole()
        if (isMounted && roleId !== currentRoleId) {
          console.log(`Role changed from ${currentRoleId} to ${roleId}, refreshing menu`)
          setCurrentRoleId(roleId)
          return true
        }
        return false
      } catch (err) {
        console.error("Error checking role changes:", err)
        return false
      }
    }

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

    // Also check for role changes
    checkRoleChanges()

    // Set up a refresh interval (every 10 seconds)
    const refreshInterval = setInterval(async () => {
      console.log("Checking for role changes...")
      const roleChanged = await checkRoleChanges()

      if (roleChanged) {
        console.log("Role changed, refreshing menu data...")
        loadMenu()
      }
    }, 10000)

    return () => {
      isMounted = false
      clearInterval(refreshInterval)
    }
  }, [currentRoleId])

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
