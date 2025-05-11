"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MenuIcon } from "@/components/dynamic-menu/menu-icon"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Info } from "lucide-react"
import { getMenuItemsForRole } from "@/services/unified-menu-service"
import type { MenuItem } from "@/types/menu"

interface Role {
  id: number
  title: string
}

interface Permission {
  canView: boolean
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
}

export function MenuPermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [permissions, setPermissions] = useState<Record<number, Permission>>({})
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")

  // Create Supabase client
  const supabase = createClient()

  // Load roles
  const loadRoles = async () => {
    setError(null)
    try {
      const { data, error } = await supabase.from("roles").select("id, title").order("title")

      if (error) throw error

      if (data && data.length > 0) {
        setRoles(data)
        setSelectedRole(data[0].id)
      } else {
        setError("No roles found. Please check if the roles table exists and has data.")
      }
    } catch (error: any) {
      console.error("Error loading roles:", error)
      setError(`Failed to load roles: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to load roles. See console for details.",
        variant: "destructive",
      })
    }
  }

  // Load menu items and permissions for the selected role
  const loadMenuItemsAndPermissions = async () => {
    if (!selectedRole) return

    setLoading(true)
    try {
      // Use the unified menu service to get menu items and permissions
      const { menuItems, permissions } = await getMenuItemsForRole(selectedRole)

      if (menuItems.length === 0) {
        setError("No menu items found. Please check if the menu_items table exists and has data.")
        return
      }

      setMenuItems(menuItems)
      setPermissions(permissions)
    } catch (error: any) {
      console.error("Error loading menu items and permissions:", error)
      setError(`Failed to load menu data: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to load menu data. See console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial data loading
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      await loadRoles()
      setLoading(false)
    }

    initializeData()
  }, [])

  // Load menu items and permissions when selected role changes
  useEffect(() => {
    if (selectedRole) {
      loadMenuItemsAndPermissions()
    }
  }, [selectedRole])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRoles()
    if (selectedRole) {
      await loadMenuItemsAndPermissions()
    }
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Data has been refreshed",
    })
  }

  // Synchronize menu structure
  const handleSyncMenus = async () => {
    setSyncStatus("syncing")
    try {
      // Call API to synchronize menus
      const response = await fetch("/api/admin/sync-menus", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to synchronize menus: ${response.statusText}`)
      }

      // Refresh data after sync
      await handleRefresh()

      setSyncStatus("success")
      toast({
        title: "Success",
        description: "Menu structure has been synchronized",
      })
    } catch (error: any) {
      console.error("Error synchronizing menus:", error)
      setSyncStatus("error")
      toast({
        title: "Error",
        description: `Failed to synchronize menus: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Organize menu items into a tree structure
  const organizeMenuItems = (items: MenuItem[]) => {
    const map: Record<number, MenuItem & { children: any[] }> = {}
    const roots: any[] = []

    // First, create a map of all items
    items.forEach((item) => {
      map[item.id] = { ...item, children: [] }
    })

    // Then, build the tree
    items.forEach((item) => {
      if (item.parentId === null) {
        roots.push(map[item.id])
      } else if (map[item.parentId]) {
        map[item.parentId].children.push(map[item.id])
      }
    })

    return roots.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const menuTree = organizeMenuItems(menuItems)

  // Handle permission change
  const handlePermissionChange = (
    menuItemId: number,
    permission: "canView" | "canAdd" | "canEdit" | "canDelete",
    checked: boolean,
  ) => {
    // Update local state
    setPermissions((prev) => {
      const newPermissions = { ...prev }

      // Create permission object if it doesn't exist
      if (!newPermissions[menuItemId]) {
        newPermissions[menuItemId] = {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        }
      }

      // If we're turning off "canView", turn off all other permissions too
      if (permission === "canView" && !checked) {
        newPermissions[menuItemId] = {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        }
      }
      // If we're turning on any other permission, make sure "canView" is also on
      else if (permission !== "canView" && checked) {
        newPermissions[menuItemId] = {
          ...newPermissions[menuItemId],
          [permission]: checked,
          canView: true,
        }
      }
      // Otherwise just toggle the specific permission
      else {
        newPermissions[menuItemId] = {
          ...newPermissions[menuItemId],
          [permission]: checked,
        }
      }

      return newPermissions
    })
  }

  // Save permissions to database
  const savePermissions = async () => {
    if (!selectedRole) return

    setSaving(true)
    try {
      // Convert permissions object to array
      const permissionsArray = Object.entries(permissions).map(([menuItemId, perm]) => ({
        role_id: selectedRole,
        menu_item_id: Number.parseInt(menuItemId),
        can_view: perm.canView,
        can_add: perm.canAdd,
        can_edit: perm.canEdit,
        can_delete: perm.canDelete,
      }))

      // First delete existing permissions
      const { error: deleteError } = await supabase.from("role_menu_permissions").delete().eq("role_id", selectedRole)

      if (deleteError) throw deleteError

      // Then insert new permissions
      if (permissionsArray.length > 0) {
        const { error: insertError } = await supabase.from("role_menu_permissions").insert(permissionsArray)

        if (insertError) throw insertError
      }

      toast({
        title: "Success",
        description: "Permissions saved successfully",
      })
    } catch (error: any) {
      console.error("Error saving permissions:", error)
      toast({
        title: "Error",
        description: `Failed to save permissions: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Render a menu item row recursively
  const renderMenuItem = (item: any, depth = 0) => {
    const permission = permissions[item.id] || {
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
    }

    return (
      <div key={item.id} className="space-y-2">
        <div className="flex items-center p-2 hover:bg-muted rounded-md" style={{ marginLeft: `${depth * 20}px` }}>
          <div className="flex items-center flex-1 gap-2">
            {item.icon && <MenuIcon name={item.icon} className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium">{item.name}</span>
            {item.path && <span className="text-xs text-muted-foreground">{item.path}</span>}
            {!item.isVisible && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Hidden</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`view-${item.id}`}
                checked={permission.canView}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "canView", checked === true)}
              />
              <label htmlFor={`view-${item.id}`} className="text-sm">
                View
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`add-${item.id}`}
                checked={permission.canAdd}
                disabled={!permission.canView}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "canAdd", checked === true)}
              />
              <label htmlFor={`add-${item.id}`} className="text-sm">
                Add
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`edit-${item.id}`}
                checked={permission.canEdit}
                disabled={!permission.canView}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "canEdit", checked === true)}
              />
              <label htmlFor={`edit-${item.id}`} className="text-sm">
                Edit
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`delete-${item.id}`}
                checked={permission.canDelete}
                disabled={!permission.canView}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "canDelete", checked === true)}
              />
              <label htmlFor={`delete-${item.id}`} className="text-sm">
                Delete
              </label>
            </div>
          </div>
        </div>
        {item.children && item.children.length > 0 && (
          <div className="space-y-2">{item.children.map((child: any) => renderMenuItem(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Role-Based Menu Permissions</CardTitle>
            <CardDescription>
              Configure which menu items are visible to each role and what actions they can perform
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSyncMenus} disabled={syncStatus === "syncing"}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              {syncStatus === "syncing" ? "Synchronizing..." : "Sync Menu Structure"}
            </Button>
            <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syncStatus === "success" && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Menu Synchronized</AlertTitle>
              <AlertDescription>
                The menu structure has been successfully synchronized with the main navigation.
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {roles.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Roles Found</AlertTitle>
                  <AlertDescription>
                    No roles were found in the database. Please check if the roles table exists and has data.
                  </AlertDescription>
                </Alert>
              ) : menuItems.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Menu Items Found</AlertTitle>
                  <AlertDescription>
                    No menu items were found in the database. Please check if the menu_items table exists and has data.
                  </AlertDescription>
                </Alert>
              ) : (
                <Tabs defaultValue={selectedRole?.toString()} onValueChange={(value) => setSelectedRole(Number(value))}>
                  <TabsList className="mb-4">
                    {roles.map((role) => (
                      <TabsTrigger key={role.id} value={role.id.toString()}>
                        {role.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {roles.map((role) => (
                    <TabsContent key={role.id} value={role.id.toString()}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <div className="flex-1 font-semibold">Menu Item</div>
                          <div className="flex items-center gap-4">
                            <div className="w-16 text-center text-sm">View</div>
                            <div className="w-16 text-center text-sm">Add</div>
                            <div className="w-16 text-center text-sm">Edit</div>
                            <div className="w-16 text-center text-sm">Delete</div>
                          </div>
                        </div>

                        <div className="space-y-2">{menuTree.map((item) => renderMenuItem(item))}</div>

                        <div className="flex justify-end mt-6">
                          <Button onClick={savePermissions} disabled={saving}>
                            {saving ? "Saving..." : "Save Permissions"}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
