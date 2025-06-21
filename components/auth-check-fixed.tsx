"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AuthCheckFixedProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthCheckFixed({ children, redirectTo = "/login" }: AuthCheckFixedProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    async function checkAuth() {
      try {
        console.log("🔍 Checking authentication status...")
        
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch("/api/auth/status", {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!mounted) return
        
        console.log("📨 Auth check response status:", response.status)
        
        if (!response.ok) {
          throw new Error(`Auth API returned ${response.status}`)
        }
        
        const data = await response.json()
        console.log("📦 Auth check response:", data.authenticated ? "✅ Authenticated" : "❌ Not authenticated")
        
        if (data.authenticated) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          // Use router.push instead of window.location to avoid hard reload
          const currentPath = window.location.pathname
          router.push(`${redirectTo}?from=${encodeURIComponent(currentPath)}`)
        }
      } catch (error) {
        console.error("❌ Auth check failed:", error)
        
        if (!mounted) return
        
        setError(error instanceof Error ? error.message : "Authentication check failed")
        setIsAuthenticated(false)
        
        // For errors, redirect to login with error parameter
        router.push(`${redirectTo}?error=auth_check_failed`)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [router, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Checking Authentication</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>You must be logged in to access this page.</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
            {error && (
              <p className="text-xs text-red-500 mt-2">Error: {error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
