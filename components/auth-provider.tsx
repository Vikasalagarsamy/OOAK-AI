"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, logout } from "@/actions/auth-actions"
import { useToast } from "@/components/ui/use-toast"

// Define the user type
type User = {
  id: number | string
  username: string
  firstName: string
  lastName: string
  email: string
  roleId: number | string
  roleName: string
  isAdmin: boolean
} | null

// Create context
type AuthContextType = {
  user: User
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAdmin: boolean
  hasPermission: (resource: string, action: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
  isAdmin: false,
  hasPermission: async () => false,
})

// Hook to use auth context
export const useAuth = () => useContext(AuthContext)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Function to fetch user data
  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Failed to refresh user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
      })
    }
  }

  // Check permission function that can be used in components
  const checkPermission = async (resource: string, action: string) => {
    if (!user) return false
    if (user.isAdmin) return true

    // For non-admins, would typically check against the permissions table
    // This is a simplified implementation
    return false
  }

  // Load user data on initial load
  useEffect(() => {
    const publicPaths = ["/login", "/forgot-password"]
    if (!publicPaths.includes(pathname)) {
      refreshUser()
    } else {
      setLoading(false)
    }
  }, [pathname])

  const value = {
    user,
    loading,
    logout: handleLogout,
    refreshUser,
    isAdmin: user?.isAdmin || false,
    hasPermission: checkPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
