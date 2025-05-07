"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase-browser"
import { Skeleton } from "@/components/ui/skeleton"
import { MenuIcon } from "@/components/dynamic-menu/menu-icon"

interface Role {
  id: number
  title: string
}

interface MenuItem {
  id: number
  parent_id: number | null
  name: string
  path: string | null
  icon: string | null
  is_visible: boolean
  sort_order: number
}

interface MenuPermission {
  role_id: number
  menu_item_id: number
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

export function MenuPermissionsDebugger() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [permissions, setPermissions] = useState<MenuPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("roles").select("id, title").order("title")

        if (error) throw error

        setRoles(data || [])
        if (data && data.length > 0) {
          setSelectedRole(data[0].id)
        }
      } catch (err: any) {
        console.error("Error fetching roles:", err)
        setError(`Error fetching roles: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [])

  // Fetch menu items
  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("menu_items").select("*").order("sort_order")

        if (error) throw error

        setMenuItems(data || [])
      } catch (err: any) {
        console.error("Error fetching menu items:", err)
        setError(`Error fetching menu items: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMenuItems()
  }, [])

  // Fetch permissions when role changes
  useEffect(() => {
    async function fetchPermissions() {
      if (!selectedRole) return

      try {
        setLoading(true)
        const { data, error } = await supabase.from("role_menu_permissions").select("*").eq("role_id", selectedRole)

        if (error) throw error

        setPermissions(data || [])
      } catch (err: any) {
        console.error("Error fetching permissions:", err)
        setError(`Error fetching permissions: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [selectedRole])

  // Build menu tree
  const buildMenuTree = (items: MenuItem[], parentId: number | null = null) => {
    return items
      .filter((item) => item.parent_id === parentId)
      .map((item) => ({
        ...item,
        children: buildMenuTree(items, item.id),
      }))
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  const menuTree = buildMenuTree(menuItems)

  // Check if a menu item has permission
  const hasPermission = (menuItemId: number, permType: "can_view" | "can_add" | "can_edit" | "can_delete") => {
    const permission = permissions.find((p) => p.menu_item_id === menuItemId)
    return permission ? permission[permType] : false
  }

  // Filter menu items based on tab
  const getFilteredMenuItems = () => {
    if (activeTab === "all") return menuItems
    if (activeTab === "visible") return menuItems.filter((item) => item.is_visible)
    if (activeTab === "hidden") return menuItems.filter((item) => !item.is_visible)
    if (activeTab === "withPermission") {
      return menuItems.filter((item) => hasPermission(item.id, "can_view"))
    }
    if (activeTab === "withoutPermission") {
      return menuItems.filter((item) => !hasPermission(item.id, "can_view"))
    }
    return menuItems
  }

  // Render menu item with permissions
  const renderMenuItem = (item: any, depth = 0, parentHasPermission = true) => {
    const hasViewPermission = hasPermission(item.id, "can_view")
    const hasAddPermission = hasPermission(item.id, "can_add")
    const hasEditPermission = hasPermission(item.id, "can_edit")
    const hasDeletePermission = hasPermission(item.id, "can_delete")

    // Check if this is the account creation menu item
    const isAccountCreation =
      item.path === "/organization/account-creation" || item.name.toLowerCase().includes("account creation")

    return (
      <div key={item.id} className={`mb-2 ${isAccountCreation ? "bg-yellow-50 border border-yellow-200" : ""}`}>
        <div
          className={`flex items-center p-2 rounded ${isAccountCreation ? "bg-yellow-100" : "hover:bg-gray-100"}`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center flex-1 gap-2">
            {item.icon && <MenuIcon name={item.icon} className="h-4 w-4" />}
            <span className={`font-medium ${!item.is_visible ? "text-gray-400" : ""}`}>{item.name}</span>
            {isAccountCreation && <span className="text-xs bg-yellow-200 px-2 py-1 rounded">Account Creation</span>}
            {item.path && <span className="text-xs text-gray-500">{item.path}</span>}
            {!item.is_visible && <span className="text-xs bg-gray-200 px-2 py-1 rounded">Hidden</span>}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs rounded ${hasViewPermission ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}
            >
              View: {hasViewPermission ? "Yes" : "No"}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${hasAddPermission ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}
            >
              Add: {hasAddPermission ? "Yes" : "No"}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${hasEditPermission ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}
            >
              Edit: {hasEditPermission ? "Yes" : "No"}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${hasDeletePermission ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}
            >
              Delete: {hasDeletePermission ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {item.children && item.children.length > 0 && (
          <div>{item.children.map((child: any) => renderMenuItem(child, depth + 1, hasViewPermission))}</div>
        )}
      </div>
    )
  }

  // Check for account creation menu item
  const accountCreationMenuItem = menuItems.find(
    (item) => item.path === "/organization/account-creation" || item.name.toLowerCase().includes("account creation"),
  )

  const accountCreationPermission = accountCreationMenuItem
    ? permissions.find((p) => p.menu_item_id === accountCreationMenuItem.id)
    : null

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="flex items-center gap-4">
        <div className="w-64">
          <label className="block text-sm font-medium mb-1">Select Role</label>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedRole?.toString()} onValueChange={(value) => setSelectedRole(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setLoading(true)
            // Refetch permissions
            if (selectedRole) {
              supabase
                .from("role_menu_permissions")
                .select("*")
                .eq("role_id", selectedRole)
                .then(({ data, error }) => {
                  if (error) {
                    console.error("Error refreshing permissions:", error)
                    setError(`Error refreshing permissions: ${error.message}`)
                  } else {
                    setPermissions(data || [])
                  }
                  setLoading(false)
                })
            }
          }}
        >
          Refresh Data
        </Button>
      </div>

      {accountCreationMenuItem && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Account Creation Menu Item Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Menu Item ID:</span>
                <span>{accountCreationMenuItem.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Name:</span>
                <span>{accountCreationMenuItem.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Path:</span>
                <span>{accountCreationMenuItem.path || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Visible in Database:</span>
                <span className={accountCreationMenuItem.is_visible ? "text-green-600" : "text-red-600"}>
                  {accountCreationMenuItem.is_visible ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Parent ID:</span>
                <span>{accountCreationMenuItem.parent_id || "None (Top Level)"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">View Permission:</span>
                <span className={accountCreationPermission?.can_view ? "text-green-600" : "text-red-600"}>
                  {accountCreationPermission?.can_view ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="visible">Visible Items</TabsTrigger>
          <TabsTrigger value="hidden">Hidden Items</TabsTrigger>
          <TabsTrigger value="withPermission">With View Permission</TabsTrigger>
          <TabsTrigger value="withoutPermission">Without View Permission</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="border rounded-md">
              {getFilteredMenuItems().length === 0 ? (
                <div className="p-4 text-center text-gray-500">No menu items found</div>
              ) : (
                <div className="p-2">{buildMenuTree(getFilteredMenuItems()).map((item) => renderMenuItem(item))}</div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Troubleshooting Steps</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Verify the Account Creation menu item exists in the database</li>
          <li>Check that the menu item has is_visible set to true</li>
          <li>Ensure the Administrator role has view permission for this menu item</li>
          <li>Check if the parent menu item (Organization) has view permission</li>
          <li>Verify the menu item has a valid path (/organization/account-creation)</li>
          <li>Check if there are any filters in the UI components hiding this menu item</li>
        </ul>
      </div>

      <Button
        onClick={async () => {
          if (!accountCreationMenuItem) {
            setError("Account Creation menu item not found in the database")
            return
          }

          try {
            setLoading(true)

            // Ensure the menu item is visible
            const { error: updateError } = await supabase
              .from("menu_items")
              .update({ is_visible: true })
              .eq("id", accountCreationMenuItem.id)

            if (updateError) throw updateError

            // Ensure the Administrator role has permission
            if (selectedRole) {
              const { error: permError } = await supabase.from("role_menu_permissions").upsert({
                role_id: selectedRole,
                menu_item_id: accountCreationMenuItem.id,
                can_view: true,
                can_add: true,
                can_edit: true,
                can_delete: true,
              })

              if (permError) throw permError
            }

            // Refresh data
            const { data: updatedMenuItem, error: fetchError } = await supabase
              .from("menu_items")
              .select("*")
              .eq("id", accountCreationMenuItem.id)
              .single()

            if (fetchError) throw fetchError

            // Update local state
            setMenuItems((prev) =>
              prev.map((item) => (item.id === accountCreationMenuItem.id ? updatedMenuItem : item)),
            )

            // Refresh permissions
            if (selectedRole) {
              const { data: updatedPerms, error: permsError } = await supabase
                .from("role_menu_permissions")
                .select("*")
                .eq("role_id", selectedRole)

              if (permsError) throw permsError

              setPermissions(updatedPerms || [])
            }

            setError(null)
          } catch (err: any) {
            console.error("Error fixing account creation visibility:", err)
            setError(`Error fixing account creation visibility: ${err.message}`)
          } finally {
            setLoading(false)
          }
        }}
      >
        Fix Account Creation Visibility
      </Button>
    </div>
  )
}
