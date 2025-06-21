/**
 * ⚡ ULTRA-FAST AUTH PROVIDER
 * 
 * Performance Features:
 * - Zero loading states for admins
 * - Instant permission checks
 * - Pre-warmed permission cache
 * - Optimistic UI updates
 */

"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ultraAuth, type UltraUser } from "@/lib/ultra-fast-auth"

interface UltraAuthContextType {
  user: UltraUser | null
  loading: boolean
  isAdmin: boolean
  
  // 🔥 INSTANT PERMISSION CHECKS
  hasPermission: (resource: string, action?: string) => boolean
  hasPermissions: (checks: Array<{ resource: string; action?: string }>) => Record<string, boolean>
  
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refresh: () => void
}

const UltraAuthContext = createContext<UltraAuthContextType | null>(null)

interface Props {
  children: ReactNode
}

export function UltraFastAuthProvider({ children }: Props) {
  const [user, setUser] = useState<UltraUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 🚀 INITIALIZE WITH SESSION VALIDATION
  useEffect(() => {
    async function initializeAuth() {
      try {
        // First try cache for speed
        const cachedUser = ultraAuth.getCurrentUser()
        if (cachedUser) {
          setUser(cachedUser)
          setLoading(false)
          return
        }

        // If no cache, try to restore session from server
        // This is important for HTTPS/tunnel environments
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          credentials: 'include', // Important for cookies
          headers: {
            'Cache-Control': 'no-cache'
          }
        })

                 if (response.ok) {
           const data = await response.json()
           if (data.authenticated && data.user) {
             // Transform server user data to UltraUser format
             const ultraUser: UltraUser = {
               id: data.user.id.toString(),
               email: data.user.email || '',
               username: data.user.username || '',
               role: {
                 id: 0, // We'll use 0 as default since the API doesn't return roleId
                 name: data.user.roleName || 'User',
                 isAdmin: data.user.isAdmin || false,
                 permissions: data.user.isAdmin ? ['*'] : ['dashboard']
               }
             }
             
             console.log('✅ Ultra-fast auth initialized from server session:', ultraUser)
             ultraAuth.setCurrentUser(ultraUser)
             setUser(ultraUser)
           }
         }
      } catch (error) {
        console.log('Auth initialization failed, will use fallback:', error)
        // Don't show error to user, just continue without ultra auth
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // 🔥 INSTANT PERMISSION CHECKS (NO ASYNC)
  const hasPermission = (resource: string, action: string = 'view'): boolean => {
    return ultraAuth.hasPermission(resource, action)
  }

  const hasPermissions = (checks: Array<{ resource: string; action?: string }>): Record<string, boolean> => {
    return ultraAuth.hasPermissions(checks)
  }

  // 🚀 ULTRA-FAST LOGIN
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    
    try {
      const result = await ultraAuth.login(email, password)
      
      if (result.success && result.user) {
        setUser(result.user)
        setLoading(false)
        return true
      }
      
      setLoading(false)
      return false
    } catch (error) {
      console.error('Login error:', error)
      setLoading(false)
      return false
    }
  }

  // 🔥 INSTANT LOGOUT
  const logout = (): void => {
    ultraAuth.logout()
    setUser(null)
    router.push('/login')
  }

  // 🚀 REFRESH USER DATA
  const refresh = (): void => {
    const freshUser = ultraAuth.getCurrentUser()
    setUser(freshUser)
  }

  const contextValue: UltraAuthContextType = {
    user,
    loading,
    isAdmin: user?.role.isAdmin || false,
    hasPermission,
    hasPermissions,
    login,
    logout,
    refresh
  }

  return (
    <UltraAuthContext.Provider value={contextValue}>
      {children}
    </UltraAuthContext.Provider>
  )
}

// 🏎️ ULTRA-FAST HOOK
export function useUltraAuth(): UltraAuthContextType {
  const context = useContext(UltraAuthContext)
  if (!context) {
    throw new Error('useUltraAuth must be used within UltraFastAuthProvider')
  }
  return context
}

// 🔥 SPECIALIZED PERMISSION HOOK (FOR SPECIFIC COMPONENTS)
export function usePermission(resource: string, action: string = 'view'): boolean {
  const { hasPermission } = useUltraAuth()
  return hasPermission(resource, action)
}

// 🚀 BATCH PERMISSION HOOK
export function usePermissions(checks: Array<{ resource: string; action?: string }>): Record<string, boolean> {
  const { hasPermissions } = useUltraAuth()
  return hasPermissions(checks)
} 