"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase-browser"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function FixAdminPermissionsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fixAdminPermissions = async () => {
    setLoading(true)
    setSuccess(false)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Find Administrator role
      const { data: roles, error: roleError } = await supabase
        .from("roles")
        .select("id, name")
        .eq("name", "Administrator")
        .single()

      if (roleError) throw new Error(`Could not find Administrator role: ${roleError.message}`)

      const adminRoleId = roles.id

      // 2. Get all menu items
      const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("id")

      if (menuError) throw new Error(`Could not fetch menu items: ${menuError.message}`)

      // 3. For each menu item, ensure Administrator has full permissions
      for (const item of menuItems) {
        // Check if permission already exists
        const { data: existingPerm, error: checkError } = await supabase
          .from("menu_permissions")
          .select("*")
          .eq("menu_id", item.id)
          .eq("role_id", adminRoleId)

        if (checkError) {
          console.error(`Error checking permissions for menu ${item.id}:`, checkError)
          // Continue with other items
          continue
        }

        if (existingPerm && existingPerm.length > 0) {
          // Update existing permission to full access
          await supabase
            .from("menu_permissions")
            .update({
              can_view: true,
              can_add: true,
              can_edit: true,
              can_delete: true,
            })
            .eq("menu_id", item.id)
            .eq("role_id", adminRoleId)
        } else {
          // Create new permission with full access
          await supabase.from("menu_permissions").insert({
            menu_id: item.id,
            role_id: adminRoleId,
            can_view: true,
            can_add: true,
            can_edit: true,
            can_delete: true,
          })
        }
      }

      // 4. Ensure user has Administrator role
      const { error: userError } = await supabase
        .from("user_accounts")
        .update({ role_id: adminRoleId })
        .eq("username", "vikas.alagarsamy1987")

      if (userError) throw new Error(`Could not update user role: ${userError.message}`)

      setSuccess(true)
    } catch (err) {
      console.error("Failed to fix admin permissions:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Fix Administrator Permissions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Administrator Role Permissions</CardTitle>
          <CardDescription>
            This tool will ensure that the Administrator role has full permissions (view, add, edit, delete) for all
            menu items, and that the user 'vikas.alagarsamy1987' has the Administrator role.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Administrator permissions have been updated successfully. The user 'vikas.alagarsamy1987' now has full
                access to all menu items.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={fixAdminPermissions} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Permissions...
              </>
            ) : (
              "Fix Administrator Permissions"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
