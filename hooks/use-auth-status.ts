"use client"

import { useState, useEffect } from "react"

interface AuthStatus {
  authenticated: boolean
  userId?: string
  username?: string
  email?: string
  roleId?: number
  roleName?: string | null
  isAdmin: boolean
  isLoading: boolean
  error: Error | null
}

export function useAuthStatus(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>({
    authenticated: false,
    isAdmin: false,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function fetchAuthStatus() {
      try {
        // Set a timeout to prevent hanging
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch("/api/auth/status", {
          signal: controller.signal,
          headers: { "Cache-Control": "no-cache" },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Failed to fetch auth status: ${response.status}`)
        }

        const data = await response.json()

        if (isMounted) {
          setStatus({
            authenticated: data.authenticated || false,
            userId: data.userId,
            username: data.username,
            email: data.email,
            roleId: data.roleId,
            roleName: data.roleName,
            isAdmin: data.isAdmin || false,
            isLoading: false,
            error: null,
          })
        }
      } catch (error) {
        console.error("Error fetching auth status:", error)

        // For preview environment, assume authenticated admin
        if (
          typeof window !== "undefined" &&
          (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("localhost"))
        ) {
          console.log("Preview environment detected, assuming admin access")
          if (isMounted) {
            setStatus({
              authenticated: true,
              userId: "preview-user",
              username: "admin",
              email: "admin@example.com",
              roleId: 1,
              roleName: "Administrator",
              isAdmin: true,
              isLoading: false,
              error: null,
            })
          }
        } else if (isMounted) {
          setStatus((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
        }
      }
    }

    fetchAuthStatus()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  return status
}
