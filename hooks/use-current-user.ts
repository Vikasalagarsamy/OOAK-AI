"use client"

import { useEffect, useState } from "react"

type User = {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  roleId: number | string
  roleName: string
  isAdmin: boolean
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        setLoading(true)
        const response = await fetch("/api/auth/status")

        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }

        const data = await response.json()

        if (data.authenticated && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error("Error fetching current user:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  return { user, loading, error }
}
