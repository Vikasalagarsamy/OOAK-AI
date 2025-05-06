"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { Button, type ButtonProps } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-menu"
import { Skeleton } from "@/components/ui/skeleton"

type ActionType = "view" | "add" | "edit" | "delete"

interface PermissionActionButtonProps extends ButtonProps {
  action: ActionType
  path?: string // Uses current path if not provided
  fallbackElement?: React.ReactNode
}

export function PermissionActionButton({
  action,
  path,
  children,
  fallbackElement = null,
  ...props
}: PermissionActionButtonProps) {
  const pathname = usePathname()
  const currentPath = path || pathname
  const { permissions, loading } = usePermissions(currentPath)

  if (loading) {
    return <Skeleton className="h-10 w-24" />
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
    return fallbackElement
  }

  return <Button {...props}>{children}</Button>
}
