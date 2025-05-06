"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-menu"
import { Skeleton } from "@/components/ui/skeleton"

type ActionType = "view" | "add" | "edit" | "delete"

interface PermissionGuardProps {
  action: ActionType
  path?: string // Uses current path if not provided
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ action, path, children, fallback = null }: PermissionGuardProps) {
  const pathname = usePathname()
  const currentPath = path || pathname
  const { permissions, loading } = usePermissions(currentPath)

  if (loading) {
    return <Skeleton className="w-full h-24" />
  }

  // Map action to permission property
  const permissionMap: Record<ActionType, keyof typeof permissions> = {
    view: "canView",
    add: "canAdd",
    edit: "canEdit",
    delete: "canDelete",
  }

  const hasPermission = permissions[permissionMap[action]]

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
