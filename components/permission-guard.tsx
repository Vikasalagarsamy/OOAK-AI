"use client"

import type { ReactNode } from "react"

interface PermissionGuardProps {
  permissionPath: string
  action?: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({ children }: PermissionGuardProps) {
  // Always render children, bypassing permission checks
  return <>{children}</>
}
