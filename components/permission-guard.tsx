"use client"

import { useEffect, useState, type ReactNode } from "react"
import { hasPermission, getCurrentUser } from "@/lib/permission-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface PermissionGuardProps {
  permissionPath: string
  action?: string
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}

export function PermissionGuard({
  permissionPath,
  action = "view",
  children,
  fallback,
  showError = true,
}: PermissionGuardProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const user = await getCurrentUser()
        if (!user) {
          setError("Authentication required")
          setHasAccess(false)
          return
        }

        const permitted = await hasPermission(user.id, permissionPath, action)
        setHasAccess(permitted)

        if (!permitted) {
          setError(`You don't have ${action} permission for this resource`)
        }
      } catch (error: any) {
        console.error("Permission check error:", error)
        setError(error.message || "Permission check failed")
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    check()
  }, [permissionPath, action])

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  } else {
    if (fallback) {
      return <>{fallback}</>
    } else if (showError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>{error || `You don't have permission to access this resource.`}</AlertDescription>
        </Alert>
      )
    } else {
      return null
    }
  }
}
