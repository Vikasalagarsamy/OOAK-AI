"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

type ProtectedPageProps = {
  children: React.ReactNode
  requiredRole?: string
  requiredPermission?: {
    resource: string
    action: string
  }
}

export function ProtectedPage({ children, requiredRole, requiredPermission }: ProtectedPageProps) {
  const { user, loading, hasPermission } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      // Not authenticated, redirect to login
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to access this page.",
      })

      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`)
      return
    }

    // Check for required role
    if (!loading && user && requiredRole) {
      if (user.roleName !== requiredRole && !user.isAdmin) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: `You need to have ${requiredRole} permissions to access this page.`,
        })

        router.push("/dashboard")
        return
      }
    }

    // Check for required permission
    if (!loading && user && requiredPermission) {
      hasPermission(requiredPermission.resource, requiredPermission.action).then((hasAccess) => {
        if (!hasAccess) {
          toast({
            variant: "destructive",
            title: "Access denied",
            description: `You don't have permission to ${requiredPermission.action} ${requiredPermission.resource}.`,
          })

          router.push("/dashboard")
        }
      })
    }
  }, [loading, user, requiredRole, requiredPermission, router, pathname, toast, hasPermission])

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  // If requirements are met or there are no requirements, render the children
  return <>{children}</>
}
