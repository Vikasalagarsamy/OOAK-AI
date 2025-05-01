"use client"

import { type ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavigationMenuLink } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

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
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setHasPermission(false)
          return
        }

        // Get user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role_id")
          .eq("id", user.id)
          .single()

        if (userError || !userData) {
          console.error("Error fetching user role:", userError)
          setHasPermission(false)
          return
        }

        // Get role permissions
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("permissions")
          .eq("id", userData.role_id)
          .single()

        if (roleError || !roleData) {
          console.error("Error fetching role permissions:", roleError)
          setHasPermission(false)
          return
        }

        // Parse permissions
        const permissions =
          typeof roleData.permissions === "string" ? JSON.parse(roleData.permissions) : roleData.permissions

        // Check if user has required permission
        const permissionObj = permissions[requiredPermission]
        setHasPermission(permissionObj && permissionObj.view === true)
      } catch (error) {
        console.error("Error checking permissions:", error)
        setHasPermission(false)
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
