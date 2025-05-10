"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Role, DEFAULT_ROLES } from "@/types/role-permissions"
import { filterMenuByRole } from "@/lib/menu-permissions"
import type { MenuItem } from "@/types/menu"
import { menuStructure } from "@/lib/menu-structure"

interface RoleContextType {
  currentRole: Role
  setCurrentRole: (role: Role) => void
  filteredMenu: Record<string, MenuItem>
  availableRoles: Role[]
  isAdmin: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  // Find the admin role
  const adminRole = DEFAULT_ROLES.find((role) => role.isAdmin) || DEFAULT_ROLES[0]

  // Initialize with admin role for testing
  const [currentRole, setCurrentRole] = useState<Role>(adminRole)
  const [filteredMenu, setFilteredMenu] = useState<Record<string, MenuItem>>(menuStructure) // Initialize with full menu
  const [isAdmin, setIsAdmin] = useState<boolean>(!!adminRole.isAdmin)

  // Update filtered menu when role changes
  useEffect(() => {
    try {
      console.log(`Role changed to: ${currentRole.name} (${currentRole.id})`)
      console.log(`Is admin: ${!!currentRole.isAdmin}`)

      setIsAdmin(!!currentRole.isAdmin)

      const menu = filterMenuByRole(currentRole.id)
      console.log(`Filtered menu has ${Object.keys(menu).length} top-level items`)

      setFilteredMenu(menu)
    } catch (error) {
      console.error("Error filtering menu:", error)
      // Fallback to full menu structure if filtering fails
      setFilteredMenu(menuStructure)
    }
  }, [currentRole])

  // In a real app, you would fetch the user's role from the server here
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // This would be an API call in a real application
        // For now, we'll simulate it with a timeout
        setTimeout(() => {
          // Start with admin role for testing
          setCurrentRole(adminRole)
        }, 500)
      } catch (error) {
        console.error("Error fetching user role:", error)
      }
    }

    fetchUserRole()
  }, [adminRole])

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        filteredMenu,
        availableRoles: DEFAULT_ROLES,
        isAdmin,
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
