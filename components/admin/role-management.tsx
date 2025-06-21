"use client"

import { useState, useEffect } from "react"
import { query, transaction } from "@/lib/postgresql-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Edit, Trash2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

interface Role {
  id: number
  title: string
  description: string | null
  created_at: string
  updated_at: string | null
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        setError(null)
        console.log('🔍 Loading roles...')
        
        const result = await query(`
          SELECT id, title, description, created_at, updated_at 
          FROM roles 
          ORDER BY title
        `)

        if (!result.success) {
          throw new Error(result.error || 'Failed to load roles')
        }

        console.log(`✅ Loaded ${result.data?.length || 0} roles`)
        setRoles(result.data || [])
      } catch (err: any) {
        console.error("❌ Error loading roles:", err)
        setError(err.message || "Failed to load roles")
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [])

  const handleEditClick = (role: Role) => {
    setEditingRole(role)
    setEditTitle(role.title)
    setEditDescription(role.description || "")
  }

  const handleEditSubmit = async () => {
    if (!editingRole) return

    setIsSubmitting(true)
    try {
      if (!editTitle.trim()) {
        throw new Error("Role title is required")
      }

      console.log(`🔄 Updating role: ${editingRole.title}`)
      
      const result = await query(`
        UPDATE roles 
        SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [editTitle.trim(), editDescription.trim() || null, editingRole.id])

      if (!result.success) {
        throw new Error(result.error || 'Failed to update role')
      }

      // Update local state
      setRoles((prev) =>
        prev.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                title: editTitle.trim(),
                description: editDescription.trim() || null,
                updated_at: new Date().toISOString(),
              }
            : role,
        ),
      )

      console.log(`✅ Role updated: ${editTitle}`)
      toast({
        title: "Role Updated",
        description: `The role "${editTitle}" has been updated successfully.`,
      })

      setEditingRole(null)
    } catch (err: any) {
      console.error("❌ Error updating role:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return

    setIsSubmitting(true)
    try {
      console.log(`🗑️ Deleting role: ${roleToDelete.title}`)
      
      // Check if role is in use
      const checkResult = await query(`
        SELECT COUNT(*) as count 
        FROM user_accounts 
        WHERE role_id = $1
      `, [roleToDelete.id])

      if (!checkResult.success) {
        throw new Error(checkResult.error || 'Failed to check role usage')
      }

      const userCount = parseInt(checkResult.data?.[0]?.count || '0')
      if (userCount > 0) {
        throw new Error("Cannot delete role: It is assigned to one or more users")
      }

      // Use transaction for atomic deletion
      const deleteResult = await transaction(async (queryFn) => {
        // Delete role permissions first
        await queryFn(`
          DELETE FROM role_menu_permissions 
          WHERE role_id = $1
        `, [roleToDelete.id])

        // Delete the role
        await queryFn(`
          DELETE FROM roles 
          WHERE id = $1
        `, [roleToDelete.id])
      })

      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete role')
      }

      // Update local state
      setRoles((prev) => prev.filter((role) => role.id !== roleToDelete.id))

      console.log(`✅ Role deleted: ${roleToDelete.title}`)
      toast({
        title: "Role Deleted",
        description: `The role "${roleToDelete.title}" has been deleted successfully.`,
      })

      setDeleteDialogOpen(false)
      setRoleToDelete(null)
    } catch (err: any) {
      console.error("❌ Error deleting role:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete role",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Roles</CardTitle>
        <CardDescription>View, edit, or delete existing roles</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No roles found</div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h3 className="font-medium">{role.title}</h3>
                  {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(role)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(role)}
                    // Prevent deleting Administrator role (ID 1)
                    disabled={role.id === 1}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Role Dialog */}
        <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Update the role details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Role Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g., Sales Manager"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe the role's responsibilities and access level"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Role Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the role "{roleToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Role"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
