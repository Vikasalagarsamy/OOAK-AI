"use client"

import { useState, useEffect } from "react"
import type { MenuItem, MenuSection } from "@/types/menu-item"
import { mainNavItems, dashboardSections } from "@/config/menu-config"

interface User {
  id: string
  username: string
  roleName: string
  isAdmin: boolean
}

export function useRoleBasedMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    async function fetchUserData() {
      try {
        setLoading(true)
        const response = await fetch("/api/auth/status", {
          signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }

        const data = await response.json()

        // Check if data has the expected structure
        if (data.authenticated) {
          setUser({
            id: data.userId || "default-id",
            username: data.username || "default-user",
            roleName: data.roleName || "default-role",
            isAdmin: data.isAdmin || false,
          })
        } else {
          // Handle unauthenticated state
          setUser(null)
        }

        setError(null)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to load user data")

        // Set default admin user in case of error
        setUser({
          id: "default-id",
          username: "default-user",
          roleName: "Administrator",
          isAdmin: true,
        })
      } finally {
        setLoading(false)
      }
    }

    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      controller.abort()
      setError("Request timed out")
      setUser({
        id: "timeout-id",
        username: "default-user",
        roleName: "Administrator",
        isAdmin: true,
      })
      setLoading(false)
    }, 3000)

    fetchUserData()

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  // Filter menu items based on user role
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    if (!user) return []

    return (
      items
        .filter((item) => {
          // Check if item is admin-only
          if (item.adminOnly && !user.isAdmin) {
            return false
          }

          // Check if user has required role
          if (item.requiredRoles && !item.requiredRoles.includes(user.roleName)) {
            return false
          }

          return true
        })
        .map((item) => {
          // Also filter children if they exist
          if (item.children) {
            return {
              ...item,
              children: filterMenuItems(item.children),
            }
          }
          return item
        })
        // Remove items that have no children if they originally had children
        .filter((item) => {
          if (item.children && item.children.length === 0) {
            return false
          }
          return true
        })
    )
  }

  // Filter dashboard sections based on user role
  const filterDashboardSections = (sections: MenuSection[]): MenuSection[] => {
    if (!user) return []

    return (
      sections
        .map((section) => ({
          ...section,
          items: filterMenuItems(section.items),
        }))
        // Remove sections with no items
        .filter((section) => section.items.length > 0)
    )
  }

  const filteredMainNav = filterMenuItems(mainNavItems)
  const filteredDashboardSections = filterDashboardSections(dashboardSections)

  return {
    user,
    loading,
    error,
    mainNav: filteredMainNav,
    dashboardSections: filteredDashboardSections,
    isAdmin: user?.isAdmin || false,
  }
}
