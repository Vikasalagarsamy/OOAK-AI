"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { hasMenuPermission } from "@/lib/permission-checker"
import { extractMenuStructure } from "@/lib/menu-extractor"
import { getCurrentUser } from "@/actions/auth-actions"
import { AlertCircle, Shield, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface RouteProtectorProps {
  children: React.ReactNode
  fallbackPath?: string
}

// Cache for route permissions - avoid re-checking on every navigation
let routePermissionCache: {
  [pathname: string]: {
    hasAccess: boolean
    isAdmin: boolean
    timestamp: number
    userId: string
  }
} = {}

// Cache duration: 5 minutes
const PERMISSION_CACHE_DURATION = 5 * 60 * 1000

// Function to clear permission cache
export const clearRoutePermissionCache = () => {
  routePermissionCache = {}
  console.log("🗑️ Route permission cache cleared")
}

export function RouteProtector({ children, fallbackPath = "/dashboard" }: RouteProtectorProps) {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Skip protection for login/public pages
        if (pathname === "/login" || pathname === "/register" || pathname === "/") {
          setHasAccess(true)
          setLoading(false)
          return
        }

        // Check cache first
        const cached = routePermissionCache[pathname]
        if (cached && (Date.now() - cached.timestamp) < PERMISSION_CACHE_DURATION) {
          console.log("⚡ Using cached route permission for", pathname)
          setHasAccess(cached.hasAccess)
          setIsAdmin(cached.isAdmin)
          setLoading(false)
          
          // Background validation
          validatePermissionInBackground()
          return
        }

        console.log("🔍 Checking route permission for", pathname)
        await checkPermissionFresh()
      } catch (error) {
        console.error("Error checking route access:", error)
        // On error, allow access to prevent breaking the app
        setHasAccess(true)
        setLoading(false)
      }
    }

    // Background validation (doesn't affect immediate loading)
    const validatePermissionInBackground = async () => {
      try {
        const user = await getCurrentUser()
        const cached = routePermissionCache[pathname]
        if (user?.id !== cached?.userId) {
          console.log("👤 User changed, refreshing route permissions...")
          await checkPermissionFresh()
        }
      } catch (error) {
        console.log("🔍 Background route validation failed, keeping cache")
      }
    }

    // Fresh permission check
    const checkPermissionFresh = async () => {
      setLoading(true)
      
      const user = await getCurrentUser()
      if (!user) {
        console.log("❌ No user found, redirecting to login")
        router.push("/login")
        return
      }

      // Admin has access to everything
      if (user.isAdmin) {
        console.log("✅ Admin user, granting full access")
        const accessData = {
          hasAccess: true,
          isAdmin: true,
          timestamp: Date.now(),
          userId: user.id
        }
        routePermissionCache[pathname] = accessData
        setIsAdmin(true)
        setHasAccess(true)
        setLoading(false)
        return
      }

      // Find the menu item that corresponds to this route
      const menuStructure = extractMenuStructure()
      let menuId: string | null = null

      // Find matching menu item
      for (const section of menuStructure) {
        if (section.path === pathname) {
          menuId = section.id
          break
        }
        
        if (section.children) {
          for (const child of section.children) {
            if (child.path === pathname) {
              menuId = child.id
              break
            }
          }
        }
        
        if (menuId) break
      }

      if (!menuId) {
        console.log("⚠️ No menu item found for path:", pathname, "- allowing access")
        const accessData = {
          hasAccess: true,
          isAdmin: false,
          timestamp: Date.now(),
          userId: user.id
        }
        routePermissionCache[pathname] = accessData
        setHasAccess(true)
        setLoading(false)
        return
      }

      // Check permission
      const hasPermission = await hasMenuPermission(menuId, 'view')
      console.log(`🔒 Permission check for ${pathname} (${menuId}):`, hasPermission)

      // Cache the result
      const accessData = {
        hasAccess: hasPermission,
        isAdmin: false,
        timestamp: Date.now(),
        userId: user.id
      }
      routePermissionCache[pathname] = accessData

      if (hasPermission) {
        setHasAccess(true)
        setLoading(false)
      } else {
        console.log("❌ Access denied, redirecting to:", fallbackPath)
        router.push(fallbackPath)
      }
    }

    checkAccess()
  }, [pathname, router, fallbackPath])

  // Only show loading for fresh permission checks, not cached ones
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription className="mb-4">
              You don't have permission to access this page. Contact your administrator to request access.
            </AlertDescription>
            <Button 
              variant="outline" 
              onClick={() => router.push(fallbackPath)}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </Alert>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 