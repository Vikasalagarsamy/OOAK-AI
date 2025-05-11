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
import { AlertCircle, RefreshCw, Info, Clock, Plus, Pencil } from "lucide-react"
import { getMenuItemsForRole, detectMenuChanges, updateMenuTracking } from "@/services/unified-menu-service"
import type { MenuItem } from "@/types/menu"
import { Badge } from "@/components/ui/badge"

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

interface MenuItemWithStatus extends MenuItem {
  status?: "new" | "modified" | "removed"
  children?: MenuItemWithStatus[]
}

export function MenuPermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemWithStatus[]>([])
  const [permissions, setPermissions] = useState<Record<number, Permission>>({})
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")
  const [menuChanges, setMenuChanges] = useState<{
    added: MenuItem[]
    removed: MenuItem[]
    modified: MenuItem[]
  }>({ added: [], removed: [], modified: [] })
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [trackingInitialized, setTrackingInitialized] = useState(false)

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

  // Initialize menu tracking
  const initializeMenuTracking = async () => {
    try {
      // Check if tracking table exists and initialize it if needed
      const { data: tableExists, error: tableError } = await supabase.rpc("check_if_table_exists", {
        table_name: "menu_items_tracking",
      })

      if (tableError || !tableExists) {
        // Create and initialize the tracking table
        await updateMenuTracking()
        toast({
          title: "Menu Tracking Initialized",
          description: "Menu tracking has been set up for the first time.",
        })
      }

      setTrackingInitialized(true)
    } catch (error: any) {
      console.error("Error initializing menu tracking:", error)
      toast({
        title: "Warning",
        description: "Could not initialize menu tracking. Change detection may not work correctly.",
        variant: "destructive",
      })
    }
  }

  // Check for menu changes
  const checkMenuChanges = async () => {
    try {
      // Only check for changes if tracking is initialized
      if (!trackingInitialized) {
        await initializeMenuTracking()
        return { added: [], removed: [], modified: [] }
      }

      const changes = await detectMenuChanges()
      setMenuChanges(changes)

      // If there are changes, update the menu items with status indicators
      if (changes.added.length > 0 || changes.modified.length > 0 || changes.removed.length > 0) {
        if (selectedRole) {
          await loadMenuItemsAndPermissions(true)
        }
      }

      return changes
    } catch (error: any) {
      console.error("Error checking menu changes:", error)
      return { added: [], removed: [], modified: [] }
    }
  }

  // Load menu items and permissions for the selected role
  const loadMenuItemsAndPermissions = async (checkForChanges = false) => {
    if (!selectedRole) return

    setLoading(true)
    try {
      // Use the unified menu service to get menu items and permissions
      const { menuItems, permissions } = await getMenuItemsForRole(selectedRole)

      if (menuItems.length === 0) {
        setError("No menu items found. Please check if the menu_items table exists and has data.")
        return
      }

      // If we need to check for changes, do that now
      let changes = menuChanges
      if (checkForChanges && trackingInitialized) {
        changes = await checkMenuChanges()
      }

      // Mark items with their status
      const itemsWithStatus: MenuItemWithStatus[] = menuItems.map((item) => {
        const status = changes.added.find((i) => i.id === item.id)
          ? "new"
          : changes.modified.find((i) => i.id === item.id)
            ? "modified"
            : undefined

        return {
          ...item,
          status,
        }
      })

      // Add any removed items (they won't be in the current menu items)
      changes.removed.forEach((removedItem) => {
        itemsWithStatus.push({
          ...removedItem,
          status: "removed",
        })
      })

      setMenuItems(itemsWithStatus)
      setPermissions(permissions)
      setLastRefreshed(new Date())
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
      await initializeMenuTracking()
      await loadRoles()
      setLoading(false)
    }

    initializeData()
  }, [])

  // Load menu items and permissions when selected role changes
  useEffect(() => {
    if (selectedRole) {
      loadMenuItemsAndPermissions(true)
    }
  }, [selectedRole])

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefreshEnabled && !autoRefreshInterval) {
      const interval = setInterval(() => {
        handleRefresh()
      }, 30000) // Refresh every 30 seconds
      setAutoRefreshInterval(interval)
    } else if (!autoRefreshEnabled && autoRefreshInterval) {
      clearInterval(autoRefreshInterval)
      setAutoRefreshInterval(null)
    }

    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
      }
    }
  }, [autoRefreshEnabled])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRoles()
    if (selectedRole) {
      await loadMenuItemsAndPermissions(true)
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

      // Update the menu tracking table
      await updateMenuTracking()

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
  const organizeMenuItems = (items: MenuItemWithStatus[]) => {
    const map: Record<number, MenuItemWithStatus & { children: any[] }> = {}
    const roots: any[] = []

    // First, create a map of all items
    items.forEach((item) => {
      if (!item.status || item.status !== "removed") {
        map[item.id] = { ...item, children: [] }
      }
    })

    // Then, build the tree (excluding removed items from the hierarchy)
    items.forEach((item) => {
      if (item.status === "removed") {
        // Add removed items at the root level
        roots.push({ ...item, children: [] })
      } else if (item.parentId === null) {
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

      // Update the menu tracking table to reflect the current state
      await updateMenuTracking()

      // Refresh to show the updated state
      await loadMenuItemsAndPermissions(true)

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

  // Get status badge for menu item
  const getStatusBadge = (status?: "new" | "modified" | "removed") => {
    if (!status) return null

    const variants = {
      new: { variant: "success" as const, icon: <Plus className="h-3 w-3 mr-1" /> },
      modified: { variant: "warning" as const, icon: <Pencil className="h-3 w-3 mr-1" /> },
      removed: { variant: "destructive" as const, icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    }

    return (
      <Badge variant={variants[status].variant} className="ml-2">
        {variants[status].icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Render a menu item row recursively
  const renderMenuItem = (item: MenuItemWithStatus, depth = 0) => {
    const permission = permissions[item.id] || {
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
    }

    // For removed items, show them with a different style
    const isRemoved = item.status === "removed"

    return (
      <div key={item.id} className="space-y-2">
        <div
          className={`flex items-center p-2 rounded-md ${isRemoved ? "bg-red-50" : "hover:bg-muted"} ${
            item.status === "new" ? "bg-green-50" : ""
          } ${item.status === "modified" ? "bg-yellow-50" : ""}`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center flex-1 gap-2">
            {item.icon && (
              <MenuIcon
                name={item.icon}
                className={`h-4 w-4 ${isRemoved ? "text-red-400" : "text-muted-foreground"}`}
              />
            )}
            <span className={`font-medium ${isRemoved ? "line-through text-red-500" : ""}`}>{item.name}</span>
            {item.path && <span className="text-xs text-muted-foreground">{item.path}</span>}
            {!item.isVisible && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Hidden</span>}
            {getStatusBadge(item.status)}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`view-${item.id}`}
                checked={permission.canView}
                disabled={isRemoved}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "canView", checked === true)}
              />
              <label htmlFor={`view-${item.id}`} className={`text-sm ${isRemoved ? "text-red-500" : ""}`}>
                View
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`add-${item.id}`}
                checked={permission.canAdd}
                disabled={isRemoved || !permission.canView}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "canAdd", checked === true)}
              />
              <label htmlFor={`add-${item.id}`} className={`text-sm ${isRemoved ? "text-red-500" : ""}`}>
                Add
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`edit-${item.id}`}
                checked={permission.canEdit}
                disabled={isRemoved || !permission.canView}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "canEdit", checked === true)}
              />
              <label htmlFor={`edit-${item.id}`} className={`text-sm ${isRemoved ? "text-red-500" : ""}`}>
                Edit
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`delete-${item.id}`}
                checked={permission.canDelete}
                disabled={isRemoved || !permission.canView}
                onCheckedChange={(checked) => handlePermissionChange(item.id, "canDelete", checked === true)}
              />
              <label htmlFor={`delete-${item.id}`} className={`text-sm ${isRemoved ? "text-red-500" : ""}`}>
                Delete
              </label>
            </div>
          </div>
        </div>
        {item.children && item.children.length > 0 && (
          <div className="space-y-2">{item.children.map((child) => renderMenuItem(child, depth + 1))}</div>
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

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="auto-refresh"
                checked={autoRefreshEnabled}
                onCheckedChange={(checked) => setAutoRefreshEnabled(checked === true)}
              />
              <label htmlFor="auto-refresh" className="text-sm">
                Auto-refresh (every 30s)
              </label>
            </div>
          </div>

          {menuChanges.added.length > 0 || menuChanges.modified.length > 0 || menuChanges.removed.length > 0 ? (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Menu Changes Detected</AlertTitle>
              <AlertDescription>
                <div className="text-sm">
                  {menuChanges.added.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">New</Badge>
                      <span>{menuChanges.added.length} new menu items</span>
                    </div>
                  )}
                  {menuChanges.modified.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Modified</Badge>
                      <span>{menuChanges.modified.length} modified menu items</span>
                    </div>
                  )}
                  {menuChanges.removed.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Removed</Badge>
                      <span>{menuChanges.removed.length} removed menu items</span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

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
