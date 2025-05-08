"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createMenuPermissionsFunctions } from "@/actions/create-menu-permissions-functions"

export function CreateMenuPermissionsFunctions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCreateFunctions = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await createMenuPermissionsFunctions()

      if (!result.success) {
        throw new Error(result.error || "Failed to create functions")
      }

      setSuccess(true)
      toast({
        title: "Success",
        description: "Menu permissions functions created successfully",
      })
    } catch (err: any) {
      console.error("Error creating functions:", err)
      setError(`Failed to create functions: ${err.message}`)
      toast({
        title: "Error",
        description: `Failed to create functions: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Menu Permissions Functions</CardTitle>
        <CardDescription>
          Create or update the database functions needed for role-based menu permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Menu permissions functions created successfully
            </AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          This will create or update the following database functions:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
          <li>
            <code>get_user_menu_permissions</code> - Returns menu items with permissions for a user
          </li>
          <li>
            <code>check_user_menu_permission</code> - Checks if a user has a specific permission for a menu path
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCreateFunctions} disabled={loading} className="ml-auto flex items-center gap-2">
          <Database className="h-4 w-4" />
          {loading ? "Creating..." : "Create Functions"}
        </Button>
      </CardFooter>
    </Card>
  )
}
