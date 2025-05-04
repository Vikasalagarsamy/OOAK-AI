"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentUser, logout as logoutAction } from "@/actions/auth-actions"

type User = {
  id: string
  username: string
  created_at: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      setIsLoading(true)
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutAction()
      setUser(null)
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
