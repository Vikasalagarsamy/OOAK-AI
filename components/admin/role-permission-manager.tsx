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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ChevronDown, ChevronRight, Info, RefreshCw, Save } from "lucide-react"

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
  is_visible: boolean
  children?: MenuItem[]
}

interface Permission {
  menu_item_id: number
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

interface RolePermissionManagerProps {
  onRoleSelect?: (roleId: number) => void
}

export function RolePermissionManager({ onRoleSelect }: RolePermissionManagerProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [permissions, setPermissions] = useState<Record<number, Permission>>({})
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Record<number, boolean>>({})

  const supabase = createClient()

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        setError(null)
        const { data, error } = await supabase.from("roles").select("id, title").order("title")

        if (error) throw error

        setRoles(data || [])
        if (data && data.length > 0) {
          setSelectedRole(data[0].id)
        }
      } catch (error: any) {
        console.error("Error loading roles:", error)
        setError(`Failed to load roles: ${error.message}`)
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
        setError(null)
        const { data, error } = await supabase
          .from("menu_items")
          .select("id, parent_id, name, icon, path, sort_order, is_visible")
          .order("sort_order")

        if (error) throw error

        setMenuItems(data || [])

        // Initialize all menus as expanded
        const expanded: Record<number, boolean> = {}
        data?.forEach((item) => {
          expanded[item.id] = true
        })
        setExpandedMenus(expanded)
      } catch (error: any) {
        console.error("Error loading menu items:", error)
        setError(`Failed to load menu items: ${error.message}`)
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

      // Call the onRoleSelect callback if provided
      if (onRoleSelect) {
        onRoleSelect(selectedRole)
      }

      setLoading(true)
      try {
        setError(null)
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
        setError(`Failed to load permissions: ${error.message}`)
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
  }, [selectedRole, onRoleSelect])

  // Organize menu items into a tree structure
  const menuTree = organizeMenuItems(menuItems)

  // Toggle menu expansion
  const toggleMenuExpansion = (menuId: number) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }))
  }

  // Get all descendant menu item IDs for a given menu item
  const getAllDescendantIds = (menuItemId: number, items: MenuItem[]): number[] => {
    const result: number[] = []

    // Find the item and its children
    const findChildren = (id: number) => {
      const children = items.filter((item) => item.parent_id === id)

      children.forEach((child) => {
        result.push(child.id)
        findChildren(child.id) // Recursively find grandchildren, etc.
      })
    }

    findChildren(menuItemId)
    return result
  }

  // Handle permission change with cascading effect
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

        // Cascade to all children - disable all permissions for all descendants
        const descendantIds = getAllDescendantIds(menuItemId, menuItems)
        descendantIds.forEach((childId) => {
          newPermissions[childId] = {
            ...(newPermissions[childId] || { menu_item_id: childId }),
            can_view: false,
            can_add: false,
            can_edit: false,
            can_delete: false,
          }
        })
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
      setError(null)
      // Convert permissions object to array
      const permissionsArray = Object.values(permissions).map((perm) => ({
        role_id: selectedRole,
        menu_item_id: perm.menu_item_id,
        can_view: perm.can_view,
        can_add: perm.can_add,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
        updated_at: new Date().toISOString(),
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
    } catch (error: any) {
      console.error("Error saving permissions:", error)
      setError(`Failed to save permissions: ${error.message}`)
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

  // Check if a menu item is disabled due to parent being disabled
  const isDisabledDueToParent = (item: MenuItem): boolean => {
    // If this is a root item, it's not disabled due to parent
    if (item.parent_id === null) return false

    // Check if parent exists and has view permission
    const parentPermission = permissions[item.parent_id]
    if (!parentPermission) return false

    // If parent doesn't have view permission, this item is disabled
    if (!parentPermission.can_view) return true

    // Recursively check if any ancestor is disabled
    const parentItem = menuItems.find((mi) => mi.id === item.parent_id)
    if (parentItem) {
      return isDisabledDueToParent(parentItem)
    }

    return false
  }

  // Render a menu item row recursively
  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const permission = permissions[item.id] || {
      menu_item_id: item.id,
      can_view: false,
      can_add: false,
      can_edit: false,
      can_delete: false,
    }

    // Skip hidden menu items for non-admin roles
    if (!item.is_visible && selectedRole !== 1) {
      return null
    }

    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedMenus[item.id]
    const isDisabled = isDisabledDueToParent(item)

    return (
      <div key={item.id} className="space-y-2">
        <div
          className={`flex items-center p-2 rounded-md transition-colors ${!item.is_visible ? "opacity-50" : ""} ${
            isDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleMenuExpansion(item.id)}
              className="mr-2 p-1 rounded-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          {!hasChildren && <div className="w-6 mr-2" />}

          <div className="flex items-center flex-1 gap-2">
            {item.icon && (
              <MenuIcon
                name={item.icon}
                className={`h-4 w-4 ${isDisabled ? "text-gray-400" : "text-muted-foreground"}`}
              />
            )}
            <span className={`font-medium ${isDisabled ? "text-gray-400" : ""}`}>{item.name}</span>
            {item.path && (
              <span className={`text-xs ${isDisabled ? "text-gray-400" : "text-muted-foreground"}`}>{item.path}</span>
            )}
            {!item.is_visible && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Hidden</span>}
            {isDisabled && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded ml-2" aria-live="polite">
                Disabled (parent menu disabled)
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`view-${item.id}`}
                checked={permission.can_view}
                disabled={isDisabled}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "can_view", checked === true)}
                aria-label={`View permission for ${item.name}`}
              />
              <label htmlFor={`view-${item.id}`} className={`text-sm ${isDisabled ? "text-gray-400" : ""}`}>
                View
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`add-${item.id}`}
                checked={permission.can_add}
                disabled={isDisabled || !permission.can_view}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "can_add", checked === true)}
                aria-label={`Add permission for ${item.name}`}
              />
              <label
                htmlFor={`add-${item.id}`}
                className={`text-sm ${isDisabled || !permission.can_view ? "text-gray-400" : ""}`}
              >
                Add
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`edit-${item.id}`}
                checked={permission.can_edit}
                disabled={isDisabled || !permission.can_view}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "can_edit", checked === true)}
                aria-label={`Edit permission for ${item.name}`}
              />
              <label
                htmlFor={`edit-${item.id}`}
                className={`text-sm ${isDisabled || !permission.can_view ? "text-gray-400" : ""}`}
              >
                Edit
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`delete-${item.id}`}
                checked={permission.can_delete}
                disabled={isDisabled || !permission.can_view}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "can_delete", checked === true)}
                aria-label={`Delete permission for ${item.name}`}
              />
              <label
                htmlFor={`delete-${item.id}`}
                className={`text-sm ${isDisabled || !permission.can_view ? "text-gray-400" : ""}`}
              >
                Delete
              </label>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="space-y-2 border-l-2 border-gray-200 ml-3 pl-3">
            {item.children.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  Disabling a parent menu item will automatically disable all its sub-menu items. Sub-menu items cannot
                  be enabled if their parent is disabled.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between items-center">
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

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                          {menuTree.map((item) => renderMenuItem(item))}
                        </div>

                        <div className="flex justify-end mt-6">
                          <Button onClick={savePermissions} disabled={saving} className="flex items-center gap-2">
                            {saving ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Save Permissions
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedRole) {
                      setLoading(true)
                      supabase
                        .from("role_menu_permissions")
                        .select("menu_item_id, can_view, can_add, can_edit, can_delete")
                        .eq("role_id", selectedRole)
                        .then(({ data, error }) => {
                          if (error) {
                            console.error("Error refreshing permissions:", error)
                            toast({
                              title: "Error",
                              description: "Failed to refresh permissions",
                              variant: "destructive",
                            })
                          } else {
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
                          }
                          setLoading(false)
                        })
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
