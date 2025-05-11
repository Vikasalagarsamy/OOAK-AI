"use client"

import { useEffect, useState, type ReactNode } from "react"

interface PermissionGuardProps {
  children: ReactNode
  resource: string
  action: string
  fallback?: ReactNode
}

export function PermissionGuard({ children, resource, action, fallback }: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/permissions?resource=${resource}&action=${action}`)

        if (!response.ok) {
          console.error("Permission check failed")
          setHasPermission(false)
          return
        }

        const data = await response.json()
        setHasPermission(data.hasPermission)
      } catch (error) {
        console.error("Error checking permission:", error)
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [resource, action])

  if (isLoading) {
    return <div>Checking permissions...</div>
  }

  if (!hasPermission) {
    return fallback || <div>You don't have permission to access this resource.</div>
  }

  return <>{children}</>
}
