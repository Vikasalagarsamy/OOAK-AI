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
import { AlertCircle, RefreshCw } from "lucide-react"

interface Role {
  id: number
  title: string
}

interface MenuItem {
  id: number
  parent_id: number | null
  name: string
  icon: string | null
  path: string | null
  sort_order: number
}

interface Permission {
  menu_item_id: number
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
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

  // Load menu items
  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, parent_id, name, icon, path, sort_order")
        .order("sort_order")

      if (error) throw error

      if (data && data.length > 0) {
        setMenuItems(data)
      } else {
        setError("No menu items found. Please check if the menu_items table exists and has data.")
      }
    } catch (error: any) {
      console.error("Error loading menu items:", error)
      setError(`Failed to load menu items: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to load menu items. See console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load permissions for selected role
  const loadPermissions = async () => {
    if (!selectedRole) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("role_menu_permissions")
        .select("menu_item_id, can_view, can_add, can_edit, can_delete")
        .eq("role_id", selectedRole)

      if (error) throw error

      // Convert to a map for easier lookup
      const permissionsMap: Record<number, Permission> = {}
      if (data) {
        data.forEach((item) => {
          permissionsMap[item.menu_item_id] = {
            menu_item_id: item.menu_item_id,
            can_view: item.can_view,
            can_add: item.can_add,
            can_edit: item.can_edit,
            can_delete: item.can_delete,
          }
        })
      }

      setPermissions(permissionsMap)
    } catch (error: any) {
      console.error("Error loading permissions:", error)
      toast({
        title: "Error",
        description: "Failed to load permissions. See console for details.",
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
      await loadMenuItems()
      setLoading(false)
    }

    initializeData()
  }, [])

  // Load permissions when selected role changes
  useEffect(() => {
    if (selectedRole) {
      loadPermissions()
    }
  }, [selectedRole])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRoles()
    await loadMenuItems()
    if (selectedRole) {
      await loadPermissions()
    }
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Data has been refreshed",
    })
  }

  // Organize menu items into a tree structure
  const menuTree = organizeMenuItems(menuItems)

  // Handle permission change
  const handlePermissionChange = (
    menuItemId: number,
    permission: "can_view" | "can_add" | "can_edit" | "can_delete",
    checked: boolean,
  ) => {
    // Update local state
    setPermissions((prev) => {
      const newPermissions = { ...prev }

      // Create permission object if it doesn't exist
      if (!newPermissions[menuItemId]) {
        newPermissions[menuItemId] = {
          menu_item_id: menuItemId,
          can_view: false,
          can_add: false,
          can_edit: false,
          can_delete: false,
        }
      }

      // If we're turning off "can_view", turn off all other permissions too
      if (permission === "can_view" && !checked) {
        newPermissions[menuItemId] = {
          ...newPermissions[menuItemId],
          can_view: false,
          can_add: false,
          can_edit: false,
          can_delete: false,
        }
      }
      // If we're turning on any other permission, make sure "can_view" is also on
      else if (permission !== "can_view" && checked) {
        newPermissions[menuItemId] = {
          ...newPermissions[menuItemId],
          [permission]: checked,
          can_view: true,
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
      const permissionsArray = Object.values(permissions).map((perm) => ({
        role_id: selectedRole,
        menu_item_id: perm.menu_item_id,
        can_view: perm.can_view,
        can_add: perm.can_add,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
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

  // Helper function to organize menu items into a tree
  function organizeMenuItems(items: MenuItem[]) {
    const map: Record<number, MenuItem & { children: any[] }> = {}
    const roots: any[] = []

    // First, create a map of all items
    items.forEach((item) => {
      map[item.id] = { ...item, children: [] }
    })

    // Then, build the tree
    items.forEach((item) => {
      if (item.parent_id === null) {
        roots.push(map[item.id])
      } else if (map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id])
      }
    })

    return roots
  }

  // Render a menu item row recursively
  const renderMenuItem = (item: any, depth = 0) => {
    const permission = permissions[item.id] || {
      menu_item_id: item.id,
      can_view: false,
      can_add: false,
      can_edit: false,
      can_delete: false,
    }

    return (
      <div key={item.id} className="space-y-2">
        <div className="flex items-center p-2 hover:bg-muted rounded-md" style={{ marginLeft: `${depth * 20}px` }}>
          <div className="flex items-center flex-1 gap-2">
            {item.icon && <MenuIcon name={item.icon} className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium">{item.name}</span>
            {item.path && <span className="text-xs text-muted-foreground">{item.path}</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`view-${item.id}`}
                checked={permission.can_view}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "can_view", checked === true)}
              />
              <label htmlFor={`view-${item.id}`} className="text-sm">
                View
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`add-${item.id}`}
                checked={permission.can_add}
                disabled={!permission.can_view}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "can_add", checked === true)}
              />
              <label htmlFor={`add-${item.id}`} className="text-sm">
                Add
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`edit-${item.id}`}
                checked={permission.can_edit}
                disabled={!permission.can_view}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "can_edit", checked === true)}
              />
              <label htmlFor={`edit-${item.id}`} className="text-sm">
                Edit
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`delete-${item.id}`}
                checked={permission.can_delete}
                disabled={!permission.can_view}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "can_delete", checked === true)}
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
          <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
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
