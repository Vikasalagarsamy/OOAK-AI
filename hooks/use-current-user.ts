"use client"

import { useEffect, useState } from "react"

interface UserData {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  roleId: number | string
  roleName: string
  isAdmin: boolean
}

interface UseCurrentUserReturn {
  user: UserData | null
  loading: boolean
  error: string | null
}

export function useCurrentUser(): UseCurrentUserReturn {
  const [userData, setUserData] = useState<UseCurrentUserReturn>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    async function loadUser() {
      try {
        setUserData(prev => ({ ...prev, loading: true }))
        
        // Check authentication status using our JWT-based system
        const response = await fetch("/api/auth/status", {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to check auth status')
        }

        const data = await response.json()

        if (!data.authenticated || !data.user) {
          setUserData({
            user: null,
            loading: false,
            error: null
          })
          return
        }

        console.log('✅ Found authenticated user:', data.user.username)

        setUserData({
          user: {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email || '',
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            roleId: data.user.roleId,
            roleName: data.user.roleName || 'User',
            isAdmin: data.user.isAdmin || false
          },
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('❌ Error loading user data:', error)
        setUserData({
          user: null,
          loading: false,
          error: 'Failed to load user data'
        })
      }
    }

    // Load initial data
    loadUser()

    // Set up periodic auth check (optional)
    const interval = setInterval(loadUser, 30000) // Check every 30 seconds

    return () => {
      clearInterval(interval)
    }
  }, [])

  return userData
}
