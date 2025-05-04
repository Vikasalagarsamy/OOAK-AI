"use client"

import { useEffect, useState, type ReactNode } from "react"
import { hasPermission, getCurrentUser } from "@/lib/permission-utils"

interface PermissionGuardProps {
  permissionPath: string
  action?: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({ permissionPath, action = "view", children, fallback }: PermissionGuardProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        setIsLoading(true)
        const user = await getCurrentUser()
        if (!user) {
          setHasAccess(false)
          return
        }
        const permitted = await hasPermission(user.id, permissionPath, action)
        setHasAccess(permitted)
      } catch (error) {
        console.error("Permission check error:", error)
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }
    check()
  }, [permissionPath, action])

  if (isLoading) {
    return <div className="p-4 text-center">Checking permissions...</div>
  }

  if (hasAccess) {
    return <>{children}</>
  } else {
    return <>{fallback || <div className="p-4 text-center">You don't have permission to access this page.</div>}</>
  }
}
