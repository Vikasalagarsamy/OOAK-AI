"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        // Check authentication status
        const response = await fetch("/api/auth/status", {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        const data = await response.json()

        if (data.authenticated) {
          // If authenticated, redirect to dashboard
          window.location.href = "/dashboard"
        } else {
          // If not authenticated, redirect to login
          window.location.href = "/login"
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        // On error, redirect to login
        window.location.href = "/login"
      }
    }

    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
