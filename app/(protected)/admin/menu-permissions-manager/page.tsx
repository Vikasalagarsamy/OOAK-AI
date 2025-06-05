"use client"

import { useState, useEffect } from "react"
import { MenuStructureViewer } from "@/components/menu-structure-viewer"
import { MenuPermissionsEditor } from "@/components/menu-permissions-editor"
import { getMenuItemsWithChildren, getMenuItems, getRoles, getMenuPermissions } from "@/services/menu-service"
import type { MenuItem, MenuItemWithChildren, Role, RolePermission } from "@/types/menu-permissions"

export default function MenuPermissionsManagerPage() {
  const [menuItems, setMenuItems] = useState<MenuItemWithChildren[]>([])
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [menuItemsWithChildren, allItems, rolesList] = await Promise.all([
          getMenuItemsWithChildren(),
          getMenuItems(),
          getRoles(),
        ])

        setMenuItems(menuItemsWithChildren)
        setAllMenuItems(allItems)
        setRoles(rolesList)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    async function loadPermissions() {
      if (selectedMenuItem) {
        try {
          const perms = await getMenuPermissions(selectedMenuItem.id)
          setPermissions(perms)
        } catch (error) {
          console.error("Error loading permissions:", error)
        }
      }
    }

    loadPermissions()
  }, [selectedMenuItem])

  const handleSelectMenuItem = (menuItemId: number) => {
    const menuItem = allMenuItems.find((item) => item.id === menuItemId) || null
    setSelectedMenuItem(menuItem)
  }

  const handlePermissionsUpdated = async () => {
    if (selectedMenuItem) {
      const perms = await getMenuPermissions(selectedMenuItem.id)
      setPermissions(perms)
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Menu Permissions Manager</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <MenuStructureViewer menuItems={menuItems} onSelectMenuItem={handleSelectMenuItem} />
        </div>
        <div>
          <MenuPermissionsEditor
            menuItem={selectedMenuItem}
            roles={roles}
            permissions={permissions}
            onPermissionsUpdated={handlePermissionsUpdated}
          />
        </div>
      </div>
    </div>
  )
}
