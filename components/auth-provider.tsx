"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: {
    id: string
    email: string | null
    username: string | null
    firstName: string | null
    lastName: string | null
    roleId: number | null
    roleName: string | null
    isAdmin: boolean
  } | null
  loading: boolean
  error: string | null
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Function to fetch user data
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/status")
      const data = await res.json()

      if (data.authenticated && data.user) {
        setUser(data.user)
        setError(null)
      } else {
        setUser(null)
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error("Error fetching user:", err)
      setUser(null)
      setError("Failed to fetch user data")
    } finally {
      setLoading(false)
    }
  }

  // Load user data on initial load and pathname change
  useEffect(() => {
    const publicPaths = ["/login", "/forgot-password", "/reset-password"]
    
    if (!publicPaths.includes(pathname)) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [pathname])

  // Handle auth errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive"
      })
    }
  }, [error, toast])

  // Protect routes
  useEffect(() => {
    const publicPaths = ["/login", "/forgot-password", "/reset-password"]
    
    if (!loading && !user && !publicPaths.includes(pathname)) {
      console.log("🚫 Unauthorized access attempt, redirecting to login")
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`)
    }
  }, [user, loading, pathname, router])

  // Simplified logout that uses direct navigation
  const handleLogout = () => {
    window.location.href = "/api/auth/logout"
  }

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      await fetchUser()
    } catch (err) {
      console.error("Failed to refresh user:", err)
      toast({
        title: "Error",
        description: "Failed to refresh user data",
        variant: "destructive"
      })
    }
  }

  const value = {
    user,
    loading,
    error,
    logout: handleLogout,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
