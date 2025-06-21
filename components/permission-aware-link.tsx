"use client"

import { type ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavigationMenuLink } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { query } from "@/lib/postgresql-client"

interface PermissionAwareLinkProps {
  href: string
  children: ReactNode
  requiredPermission: string
  className?: string
}

export function PermissionAwareLink({ href, children, requiredPermission, className }: PermissionAwareLinkProps) {
  const pathname = usePathname()
  const [hasPermission, setHasPermission] = useState(true) // Default to true for initial render
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkPermission() {
      try {
        console.log(`🔐 Checking permission: ${requiredPermission}`)
        
        // TODO: Replace with actual auth context
        // For now, we'll skip auth check and focus on permission logic
        // This should be replaced with proper user authentication
        
        // Get user role and permissions from PostgreSQL
        // Note: This is a placeholder query - replace with actual user ID from auth context
        const result = await query(`
          SELECT ur.permissions 
          FROM users u
          JOIN user_roles ur ON u.role_id = ur.id
          WHERE u.id = $1
          LIMIT 1
        `, ['current-user-placeholder'])

        if (!result.success || !result.data || result.data.length === 0) {
          console.log("⚠️ No user permissions found, defaulting to no access")
          setHasPermission(false)
          return
        }

        const roleData = result.data[0]
        
        // Parse permissions JSON
        let permissions = {}
        try {
          permissions = typeof roleData.permissions === "string" 
            ? JSON.parse(roleData.permissions) 
            : roleData.permissions || {}
        } catch (parseError) {
          console.error("❌ Error parsing permissions JSON:", parseError)
          setHasPermission(false)
          return
        }

        // Check if user has required permission
        const permissionObj = permissions[requiredPermission]
        const hasAccess = permissionObj && permissionObj.view === true
        
        console.log(`${hasAccess ? '✅' : '❌'} Permission result for '${requiredPermission}': ${hasAccess}`)
        setHasPermission(hasAccess)
        
      } catch (error) {
        console.error("❌ Error checking permissions:", error)
        // In case of error, default to showing the link (fail-open for better UX)
        setHasPermission(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [requiredPermission])

  // Don't render anything while loading or if no permission
  if (isLoading || !hasPermission) return null

  return (
    <Link href={href} legacyBehavior passHref>
      <NavigationMenuLink
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          pathname === href && "bg-accent text-accent-foreground",
          className,
        )}
      >
        {children}
      </NavigationMenuLink>
    </Link>
  )
}
