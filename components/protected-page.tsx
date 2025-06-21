"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useUltraAuth } from "@/components/ultra-fast-auth-provider"

interface ProtectedPageProps {
  children: ReactNode
  requiredPermission?: string
  fallbackPath?: string
}

export function ProtectedPage({ 
  children, 
  requiredPermission, 
  fallbackPath = "/login" 
}: ProtectedPageProps) {
  const { user, loading, hasPermission } = useUltraAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackPath)
        return
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, loading, requiredPermission, hasPermission, router, fallbackPath])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || (requiredPermission && !hasPermission(requiredPermission))) {
    return null
  }

  return <>{children}</>
}
