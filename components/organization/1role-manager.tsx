"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { menuItems } from "@/components/dynamic-menu/menu-items"
import type { MenuItem } from "@/types/menu"

interface Role {
  id: number
  name: string
  description: string
  permissions: Record<string, {
    view: boolean
    edit: boolean
    delete: boolean
  }>
}

// Helper to flatten menuItems into a structure suitable for permissions UI
function flattenMenu(items: MenuItem[]): MenuItem[] {
  return items.map((item: MenuItem) => ({
    ...item,
    children: item.children ? flattenMenu(item.children) : [],
  }))
}

const dynamicMenuStructure = flattenMenu(menuItems)

export function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "" })
  const [isAddingRole, setIsAddingRole] = useState(false)

  const supabase = createClient()

  // Load roles
  const loadRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name")

      if (error) throw error

      // Initialize permissions if they don't exist
      const rolesWithPermissions = (data || []).map((role: any) => ({
        ...role,
        permissions: role.permissions || initializePermissions(),
      }))

      setRoles(rolesWithPermissions)
    } catch (error: any) {
      console.error("Error loading roles:", error)
      setError(`Failed to load roles: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to load roles. See console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initialize permissions for a new role
  const initializePermissions = () => {
    const permissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {}
    
    const addPermissions = (items: MenuItem[]) => {
      items.forEach(item => {
        permissions[item.id] = { view: false, edit: false, delete: false }
        if (item.children) {
          addPermissions(item.children)
        }
      })
    }

    addPermissions(dynamicMenuStructure)
    return permissions
  }

  // Initial data loading
  useEffect(() => {
    loadRoles()
  }, [])

  // Select the first role by default
  useEffect(() => {
    if (roles.length > 0 && selectedRoleId === null) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  const selectedRole = roles.find((role) => role.id === selectedRoleId)

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRoles()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Roles have been refreshed",
    })
  }

  // Handle adding new role
  const handleAddRole = async () => {
    if (!newRole.name) {
      toast({
        title: "Error",
        description: "Please enter a role name",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("roles")
        .insert({
          name: newRole.name,
          description: newRole.description,
          permissions: initializePermissions(),
        })
        .select()

      if (error) throw error

      setRoles([...roles, ...(data || [])])
      setNewRole({ name: "", description: "" })
      setIsAddingRole(false)
      toast({
        title: "Success",
        description: "Role added successfully",
      })
    } catch (error: any) {
      console.error("Error adding role:", error)
      toast({
        title: "Error",
        description: `Failed to add role: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Handle permission change
  const handlePermissionChange = async (roleId: number, menuId: string, permission: "view" | "edit" | "delete", checked: boolean) => {
    try {
      const updatedRoles = roles.map(role => {
        if (role.id === roleId) {
          const updatedPermissions = {
            ...role.permissions,
            [menuId]: {
              ...role.permissions[menuId],
              [permission]: checked,
            },
          }
          return { ...role, permissions: updatedPermissions }
        }
        return role
      })

      const { error } = await supabase
        .from("roles")
        .update({ permissions: updatedRoles.find(r => r.id === roleId)?.permissions })
        .eq("id", roleId)

      if (error) throw error

      setRoles(updatedRoles)
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: `Failed to update permissions: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Handle role deletion
  const handleDeleteRole = async (roleId: number) => {
    try {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", roleId)

      if (error) throw error

      setRoles(roles.filter(role => role.id !== roleId))
      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting role:", error)
      toast({
        title: "Error",
        description: `Failed to delete role: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="default" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar with roles */}
      <aside className="w-64 border-r bg-muted/50 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Roles</h2>
          <Button size="icon" variant="outline" onClick={() => setIsAddingRole(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <ul className="space-y-2">
            {roles
              .filter(role => role.name && role.name.trim() !== "")
              .map((role) => (
                <li key={role.id}>
                  <Button
                    variant={selectedRoleId === role.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    {role.name}
                  </Button>
                </li>
              ))}
          </ul>
        </ScrollArea>
      </aside>
      {/* Main content: permissions for selected role */}
      <main className="flex-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedRole?.name || "Select a Role"}</CardTitle>
              <CardDescription>{selectedRole?.description}</CardDescription>
            </div>
            {selectedRole && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRole(selectedRole.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedRole ? (
              <div className="space-y-6">
                {dynamicMenuStructure.map((section: MenuItem) => (
                  <div key={section.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      {/* You can add icons here if you have them mapped */}
                      <span className="font-semibold text-base">{section.name}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead></TableHead>
                          <TableHead className="w-[100px]">View</TableHead>
                          <TableHead className="w-[100px]">Edit</TableHead>
                          <TableHead className="w-[100px]">Delete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow key={section.id}>
                          <TableCell className="font-medium">{section.name}</TableCell>
                          <TableCell>
                            <Checkbox
                              checked={selectedRole.permissions[String(section.id)]?.view}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(selectedRole.id, String(section.id), "view", checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={selectedRole.permissions[String(section.id)]?.edit}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(selectedRole.id, String(section.id), "edit", checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={selectedRole.permissions[String(section.id)]?.delete}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(selectedRole.id, String(section.id), "delete", checked === true)
                              }
                            />
                          </TableCell>
                        </TableRow>
                        {section.children?.map((child: MenuItem) => (
                          <TableRow key={child.id}>
                            <TableCell className="pl-8">{child.name}</TableCell>
                            <TableCell>
                              <Checkbox
                                checked={selectedRole.permissions[String(child.id)]?.view}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(selectedRole.id, String(child.id), "view", checked === true)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={selectedRole.permissions[String(child.id)]?.edit}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(selectedRole.id, String(child.id), "edit", checked === true)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={selectedRole.permissions[String(child.id)]?.delete}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(selectedRole.id, String(child.id), "delete", checked === true)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Select a role to view and edit permissions.</div>
            )}
          </CardContent>
        </Card>
      </main>
      {/* Add Role Dialog (unchanged) */}
      <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role with a name and description
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Enter role name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Enter role description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingRole(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole}>Add Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 