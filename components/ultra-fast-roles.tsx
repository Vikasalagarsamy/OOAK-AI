"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Users, Pencil, Shield, Trash2 } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Role {
  id: number
  title: string
  name?: string
  description?: string
  permissions?: string[]
  department?: string
  level?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export function UltraFastRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const loadRolesData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('🏢 Loading roles data...')
      
      const response = await fetch('/api/roles', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result?.success) {
        setRoles(result.roles || [])
        setLoadTime(Date.now() - startTime)
        
        console.log(`✅ Roles data loaded: ${result.roles?.length || 0} roles`)
        
        toast({
          title: "Success",
          description: `Loaded ${result.roles?.length || 0} roles`,
          variant: "default",
        })
      }
      
    } catch (error) {
      console.error('❌ Failed to load roles data:', error)
      toast({
        title: "Error",
        description: "Failed to load roles data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleEditRole = async () => {
    if (!selectedRole) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update role')
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Update the local state
        setRoles(roles.map(role => 
          role.id === selectedRole.id 
            ? { ...role, title: editForm.title, description: editForm.description }
            : role
        ))
        
        setEditDialogOpen(false)
        setSelectedRole(null)
        
        toast({
          title: "Success",
          description: "Role updated successfully",
        })
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setEditForm({
      title: role.title || role.name || '',
      description: role.description || ''
    })
    setEditDialogOpen(true)
  }

  const handleManagePermissions = (role: Role) => {
    // Navigate to advanced role management page
    router.push(`/organization/roles/manage?roleId=${role.id}`)
  }

  useEffect(() => {
    loadRolesData()
  }, [])

  const getPerformanceGrade = () => {
    if (loadTime < 50) return 'A+'
    if (loadTime < 200) return 'A'
    if (loadTime < 500) return 'B'
    if (loadTime < 1000) return 'C'
    return 'F'
  }

  const getRoleLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'executive': return 'bg-red-100 text-red-800'
      case 'senior': return 'bg-purple-100 text-purple-800'
      case 'mid': return 'bg-blue-100 text-blue-800'
      case 'junior': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading roles...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Roles & Permissions</h1>
            <p className="text-gray-600">Manage organizational roles and access permissions.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadRolesData(true)}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            
            <Badge variant={loadTime < 200 ? "default" : "secondary"}>
              {loadTime || 0}ms Live
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {getPerformanceGrade()} Grade
            </Badge>
            
            <Button 
              className="flex items-center space-x-2"
              onClick={() => router.push('/organization/roles/manage')}
            >
              <Plus className="w-4 h-4" />
              <span>Add Role</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Analytics Card */}
      <Card className="w-full border-emerald-200 bg-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-800 text-sm">⚡ Real-time Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-emerald-600">{loadTime || 0}ms</div>
              <div className="text-xs text-emerald-700">Load Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{roles.length}</div>
              <div className="text-xs text-emerald-700">Roles</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{getPerformanceGrade()}</div>
              <div className="text-xs text-emerald-700">Performance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-teal-600">🚀</div>
              <div className="text-xs text-emerald-700">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Roles ({roles.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No roles found. Add your first role to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <Card key={role.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{role.title || role.name || 'Untitled Role'}</h3>
                        {role.level && (
                          <Badge className={getRoleLevelColor(role.level)}>
                            {role.level}
                          </Badge>
                        )}
                      </div>
                      
                      {role.description && (
                        <p className="text-sm text-gray-600">{role.description}</p>
                      )}
                      
                      {role.department && (
                        <p className="text-sm text-gray-600">🏢 {role.department}</p>
                      )}
                      
                      {role.permissions && role.permissions.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">Permissions:</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((permission, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-3">
                        <Badge variant={role.status === 'active' ? 'default' : 'secondary'}>
                          {role.status || 'active'}
                        </Badge>
                        
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleManagePermissions(role)}
                            title="Manage Permissions"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(role)}
                            title="Edit Role"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the role details. Use the permissions icon to manage detailed permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Role Name</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter role name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleEditRole}
              disabled={saving || !editForm.title?.trim?.()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 