"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { MenuManager, type MenuSection } from "@/lib/menu-system"
import { createClient } from "@/lib/supabase"

interface Role {
  id: string
  name: string
}

interface RoleContextType {
  currentRole: Role | null
  setCurrentRole: (role: Role) => void
  filteredMenu: readonly MenuSection[]
}

export const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [filteredMenu, setFilteredMenu] = useState<readonly MenuSection[]>([])

  // Get user's role on mount
  useEffect(() => {
    async function getUserRole() {
      try {
        const supabase = createClient()
        
        // Get current user's employee record
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Get employee with role
        const { data, error } = await supabase
          .from('employees')
          .select(`
            role_id,
            roles!inner (
              name
            )
          `)
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching role:', error)
          return
        }

        if (data) {
          setCurrentRole({
            id: data.role_id.toString(),
            name: data.roles.name
          })
        }
      } catch (error) {
        console.error('Error in getUserRole:', error)
      }
    }

    getUserRole()
  }, [])

  // Update menu when role changes
  useEffect(() => {
    if (!currentRole) return

    const menuManager = MenuManager.getInstance()
    
    menuManager.getMenuForUser({
      id: currentRole.id,
      username: currentRole.name,
      roles: [currentRole.id],
      permissions: [],
      isAdmin: false
    }).then(menu => {
      setFilteredMenu(menu)
    })
  }, [currentRole])

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        filteredMenu
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
