"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AddRoleForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate inputs
      if (!title.trim()) {
        throw new Error("Role title is required")
      }

      // Insert new role
      const { data, error: insertError } = await supabase
        .from("roles")
        .insert([
          {
            title: title.trim(),
            description: description.trim() || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      if (insertError) throw insertError

      // Get the newly created role ID
      const roleId = data?.[0]?.id

      if (!roleId) {
        throw new Error("Failed to retrieve the new role ID")
      }

      // Initialize default permissions for the new role
      // This ensures the role has at least basic permissions
      const { error: permError } = await supabase.from("role_menu_permissions").insert([
        {
          role_id: roleId,
          menu_item_id: 1, // Dashboard (assuming ID 1 is Dashboard)
          can_view: true,
          can_add: false,
          can_edit: false,
          can_delete: false,
        },
      ])

      if (permError) {
        console.error("Error setting initial permissions:", permError)
        // Continue anyway, as the role was created successfully
      }

      toast({
        title: "Role Created",
        description: `The role "${title}" has been created successfully.`,
      })

      // Reset form
      setTitle("")
      setDescription("")
    } catch (err: any) {
      console.error("Error creating role:", err)
      setError(err.message || "An error occurred while creating the role")
      toast({
        title: "Error",
        description: err.message || "Failed to create role",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Role</CardTitle>
        <CardDescription>Add a new role to the system with default permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Role Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sales Manager"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role's responsibilities and access level"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Role"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        After creating a role, you can configure its permissions in the Role Permissions section.
      </CardFooter>
    </Card>
  )
}
