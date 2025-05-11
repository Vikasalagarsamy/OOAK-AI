"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function SessionRefresh() {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  // Refresh session every 15 minutes
  useEffect(() => {
    const refreshInterval = setInterval(
      async () => {
        try {
          const response = await fetch("/api/auth/refresh-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })

          const data = await response.json()

          if (data.success) {
            console.log("Session refreshed successfully")
            setLastRefresh(Date.now())
          } else {
            console.error("Failed to refresh session:", data.error)
            // Redirect to login if session refresh fails
            router.push("/login?reason=session_expired")
          }
        } catch (error) {
          console.error("Error refreshing session:", error)
        }
      },
      15 * 60 * 1000,
    ) // 15 minutes

    return () => clearInterval(refreshInterval)
  }, [router])

  // This component doesn't render anything visible
  return null
}
