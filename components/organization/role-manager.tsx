"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, RefreshCw, Trash2, Shield, Users, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { extractMenuStructure, type PermissionMenuItem } from "@/lib/menu-extractor"

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

// Get the comprehensive menu structure from our current navigation
const comprehensiveMenuStructure = extractMenuStructure()

export function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newRole, setNewRole] = useState({ name: "", description: "" })
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['dashboard', 'organization', 'sales']))

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
    
    const addPermissions = (items: PermissionMenuItem[]) => {
      items.forEach(item => {
        permissions[item.id] = { view: false, edit: false, delete: false }
        if (item.children) {
          addPermissions(item.children)
        }
      })
    }

    addPermissions(comprehensiveMenuStructure)
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

  // Handle section access toggle (grants/revokes full access to section and all children)
  const handleSectionToggle = async (roleId: number, sectionId: string, hasAccess: boolean) => {
    try {
      const section = comprehensiveMenuStructure.find(s => s.id === sectionId)
      if (!section) return

      const updatedRoles = roles.map(role => {
        if (role.id === roleId) {
          const updatedPermissions = { ...role.permissions }
          
          // Update the section itself
          updatedPermissions[section.id] = {
            view: hasAccess,
            edit: hasAccess,
            delete: hasAccess,
          }
          
          // Update all children
          if (section.children) {
            section.children.forEach(child => {
              updatedPermissions[child.id] = {
                view: hasAccess,
                edit: hasAccess,
                delete: hasAccess,
              }
            })
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
        description: `${hasAccess ? 'Granted' : 'Revoked'} access to ${section.name}`,
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

  // Handle sub-item access toggle
  const handleSubItemToggle = async (roleId: number, itemId: string, hasAccess: boolean) => {
    try {
      const updatedRoles = roles.map(role => {
        if (role.id === roleId) {
          const updatedPermissions = { ...role.permissions }
          
          updatedPermissions[itemId] = {
            view: hasAccess,
            edit: hasAccess,
            delete: hasAccess,
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
    } catch (error: any) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: `Failed to update permissions: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Handle delete role
  const handleDeleteRole = async (roleId: number) => {
    try {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", roleId)

      if (error) throw error

      setRoles(roles.filter(role => role.id !== roleId))
      if (selectedRoleId === roleId) {
        setSelectedRoleId(roles.length > 1 ? roles.find(r => r.id !== roleId)?.id || null : null)
      }
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

  // Check if section has any access
  const sectionHasAccess = (role: Role, section: PermissionMenuItem) => {
    const sectionAccess = role.permissions[section.id]
    const childrenAccess = section.children?.some(child => 
      role.permissions[child.id]?.view || role.permissions[child.id]?.edit || role.permissions[child.id]?.delete
    )
    return (sectionAccess?.view || sectionAccess?.edit || sectionAccess?.delete) || childrenAccess
  }

  // Check if section has full access
  const sectionHasFullAccess = (role: Role, section: PermissionMenuItem) => {
    const sectionAccess = role.permissions[section.id]
    const allChildrenHaveAccess = section.children?.every(child => 
      role.permissions[child.id]?.view && role.permissions[child.id]?.edit && role.permissions[child.id]?.delete
    )
    return (sectionAccess?.view && sectionAccess?.edit && sectionAccess?.delete) && 
           (section.children ? allChildrenHaveAccess : true)
  }

  // Check if sub-item has access
  const subItemHasAccess = (role: Role, itemId: string) => {
    const access = role.permissions[itemId]
    return access?.view || access?.edit || access?.delete
  }

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-3" />
        <span className="text-lg">Loading roles...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Roles</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={loadRoles} className="mt-3">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Alert>
    )
  }

  return (
    <div className="flex gap-8">
      {/* Roles Sidebar */}
      <div className="w-80">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">User Roles</CardTitle>
                <CardDescription>Select a role to manage permissions</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddingRole(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="p-4 space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoleId === role.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted border-border'
                    }`}
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div className="flex-1">
                        <p className="font-medium">{role.name}</p>
                        {role.description && (
                          <p className={`text-sm ${selectedRoleId === role.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Panel */}
      <div className="flex-1">
        {selectedRole ? (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedRole.name} Permissions</CardTitle>
                  <CardDescription>
                    Manage what this role can access in the application
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteRole(selectedRole.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comprehensiveMenuStructure.map((section) => {
                  const hasAccess = sectionHasAccess(selectedRole, section)
                  const hasFullAccess = sectionHasFullAccess(selectedRole, section)
                  const isExpanded = expandedSections.has(section.id)

                  return (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection(section.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          <div>
                            <h3 className="font-semibold text-base">{section.name}</h3>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                          {section.children && (
                            <Badge variant="secondary" className="ml-2">
                              {section.children.length} pages
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {hasAccess && !hasFullAccess && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              Partial Access
                            </Badge>
                          )}
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`section-${section.id}`} className="text-sm font-medium">
                              Full Access
                            </Label>
                            <Switch
                              id={`section-${section.id}`}
                              checked={hasFullAccess}
                              onCheckedChange={(checked) => 
                                handleSectionToggle(selectedRole.id, section.id, checked)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {isExpanded && section.children && (
                        <div className="mt-4 ml-6 space-y-2 border-l-2 border-muted pl-4">
                          {section.children.map((child) => {
                            const childHasAccess = subItemHasAccess(selectedRole, child.id)
                            
                            return (
                              <div key={child.id} className="flex items-center justify-between py-2">
                                <div>
                                  <p className="font-medium text-sm">{child.name}</p>
                                  <p className="text-xs text-muted-foreground">{child.description}</p>
                                </div>
                                <Switch
                                  checked={childHasAccess}
                                  onCheckedChange={(checked) => 
                                    handleSubItemToggle(selectedRole.id, child.id, checked)
                                  }
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Role</h3>
                <p className="text-muted-foreground">Choose a role from the sidebar to manage its permissions</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Add a new user role and configure its permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="e.g., Sales Manager, Accountant, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Brief description of this role's purpose"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingRole(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 