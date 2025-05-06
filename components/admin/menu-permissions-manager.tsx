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

  const supabase = createClient()

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        const { data, error } = await supabase.from("roles").select("id, title").order("title")

        if (error) throw error

        setRoles(data || [])
        if (data && data.length > 0) {
          setSelectedRole(data[0].id)
        }
      } catch (error) {
        console.error("Error loading roles:", error)
        toast({
          title: "Error",
          description: "Failed to load roles",
          variant: "destructive",
        })
      }
    }

    loadRoles()
  }, [])

  // Load menu items
  useEffect(() => {
    async function loadMenuItems() {
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("id, parent_id, name, icon, path, sort_order")
          .order("sort_order")

        if (error) throw error

        setMenuItems(data || [])
      } catch (error) {
        console.error("Error loading menu items:", error)
        toast({
          title: "Error",
          description: "Failed to load menu items",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMenuItems()
  }, [])

  // Load permissions for selected role
  useEffect(() => {
    async function loadPermissions() {
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
      } catch (error) {
        console.error("Error loading permissions:", error)
        toast({
          title: "Error",
          description: "Failed to load permissions",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [selectedRole])

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
      const { error: insertError } = await supabase.from("role_menu_permissions").insert(permissionsArray)

      if (insertError) throw insertError

      toast({
        title: "Success",
        description: "Permissions saved successfully",
      })
    } catch (error) {
      console.error("Error saving permissions:", error)
      toast({
        title: "Error",
        description: "Failed to save permissions",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Menu Permissions</CardTitle>
          <CardDescription>
            Configure which menu items are visible to each role and what actions they can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
