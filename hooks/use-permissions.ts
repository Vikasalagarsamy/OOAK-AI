"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"

export function usePermissions(pathsToCheck: { path: string; action?: string }[]) {
  const { user, isAdmin, checkMultiplePermissions, loading: authLoading } = useAuth()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPermissions() {
      if (authLoading) return // Wait for auth to load

      try {
        setLoading(true)

        if (!user) {
          const results: Record<string, boolean> = {}
          pathsToCheck.forEach(perm => {
            results[perm.path] = false
          })
          setPermissions(results)
          setLoading(false)
          return
        }

        // If admin, skip API calls and set all to true
        if (isAdmin) {
          const results: Record<string, boolean> = {}
          pathsToCheck.forEach(perm => {
            results[perm.path] = true
          })
          setPermissions(results)
          setLoading(false)
          return
        }

        // For non-admins, check permissions efficiently
        const permissionResults = await checkMultiplePermissions(pathsToCheck)
        setPermissions(permissionResults)
      } catch (error) {
        console.error("Error loading permissions:", error)
        const results: Record<string, boolean> = {}
        pathsToCheck.forEach(perm => {
          results[perm.path] = false
        })
        setPermissions(results)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [user, isAdmin, authLoading, checkMultiplePermissions, pathsToCheck])

  return { permissions, loading: authLoading || loading }
}

export function usePermission(path: string, action: string = "view") {
  const { user, isAdmin, hasPermission, loading: authLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      if (authLoading) return // Wait for auth to load

      try {
        setLoading(true)

        if (!user) {
          setHasAccess(false)
          setLoading(false)
          return
        }

        // If admin, return true immediately
        if (isAdmin) {
          setHasAccess(true)
          setLoading(false)
          return
        }

        // For non-admins, check permission
        const access = await hasPermission(path, action)
        setHasAccess(access)
      } catch (error) {
        console.error("Error checking permission:", error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [user, isAdmin, authLoading, hasPermission, path, action])

  return { hasAccess, loading: authLoading || loading }
} 