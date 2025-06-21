"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AuthCheckProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthCheck({ children, redirectTo = "/login" }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    async function checkAuth() {
      // Prevent infinite retries
      if (retryCount > 3) {
        console.error("❌ Auth check failed after 3 retries, redirecting to login")
        if (mounted) {
          setIsAuthenticated(false)
          setIsLoading(false)
          // Use window.location for hard redirect to break any loops
          window.location.href = `${redirectTo}?reason=auth_failed`
        }
        return
      }

      try {
        console.log(`🔍 Checking authentication status (attempt ${retryCount + 1})...`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
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
        console.log("📦 Auth check response data:", data)
        
        if (data.authenticated) {
          console.log("✅ User is authenticated")
          setIsAuthenticated(true)
        } else {
          console.log("❌ User is not authenticated, redirecting to:", redirectTo)
          setIsAuthenticated(false)
          // Use window.location for hard redirect
          window.location.href = redirectTo
        }
      } catch (error) {
        console.error(`❌ Auth check failed (attempt ${retryCount + 1}):`, error)
        
        if (!mounted) return
        
        // If it's a network error or timeout, retry
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
          setRetryCount(prev => prev + 1)
          // Retry after delay
          timeoutId = setTimeout(() => {
            if (mounted) {
              checkAuth()
            }
          }, 2000 * (retryCount + 1)) // Exponential backoff
          return
        }
        
        // For other errors, redirect to login
        setIsAuthenticated(false)
        window.location.href = `${redirectTo}?reason=error`
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
  }, [router, redirectTo, retryCount])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Checking Authentication</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">
              {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Please wait...'}
            </p>
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
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
