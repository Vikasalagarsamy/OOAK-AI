"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Clock } from "lucide-react"
import { getRoles, getPermissions, getRolePermissions, updateRolePermission } from "@/services/permissions-service"
import type { Role, Permission, RolePermission } from "@/types/permissions"
import { PermissionsList } from "./permissions-list"
import { AuditTrailView } from "./audit-trail-view"

export function PermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<Record<number, RolePermission[]>>({})
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("permissions")

  // Load roles and permissions
  const loadData = async () => {
    setError(null)
    setLoading(true)

    try {
      // Load roles
      const rolesData = await getRoles()

      if (rolesData.length === 0) {
        setError("No roles found. Please check if the roles table exists and has data.")
        return
      }

      setRoles(rolesData)

      // Set the first role as selected by default
      if (!selectedRole && rolesData.length > 0) {
        setSelectedRole(rolesData[0].id)
      }

      // Load permissions
      const permissionsData = await getPermissions()
      setPermissions(permissionsData)

      // Load role permissions for all roles
      const rolePermissionsMap: Record<number, RolePermission[]> = {}

      for (const role of rolesData) {
        const rolePermsData = await getRolePermissions(role.id)
        rolePermissionsMap[role.id] = rolePermsData
      }

      setRolePermissions(rolePermissionsMap)
      setLastRefreshed(new Date())
    } catch (error: any) {
      console.error("Error loading data:", error)
      setError(`Failed to load data: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to load data. See console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial data loading
  useEffect(() => {
    loadData()
  }, [])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Data has been refreshed",
    })
  }

  // Handle permission change
  const handlePermissionChange = async (permissionId: number, status: string) => {
    if (!selectedRole) return

    try {
      const success = await updateRolePermission(selectedRole, permissionId, status)

      if (success) {
        // Refresh the role permissions for the selected role
        const updatedPermissions = await getRolePermissions(selectedRole)
        setRolePermissions((prev) => ({
          ...prev,
          [selectedRole]: updatedPermissions,
        }))

        toast({
          title: "Success",
          description: "Permission updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update permission",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error updating permission:", error)
      toast({
        title: "Error",
        description: `Failed to update permission: ${error.message || "Unknown error"}`,
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
            <CardTitle>Role-Based Permissions</CardTitle>
            <CardDescription>Configure which permissions are assigned to each role</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </span>
            </div>
          </div>

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
              ) : (
                <Tabs defaultValue={selectedRole?.toString()} onValueChange={(value) => setSelectedRole(Number(value))}>
                  <TabsList className="mb-4">
                    {roles.map((role) => (
                      <TabsTrigger key={role.id} value={role.id.toString()}>
                        {role.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {roles.map((role) => (
                    <TabsContent key={role.id} value={role.id.toString()}>
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                          <TabsTrigger value="permissions">Permissions</TabsTrigger>
                          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                        </TabsList>

                        <TabsContent value="permissions">
                          <PermissionsList
                            permissions={permissions}
                            rolePermissions={rolePermissions[role.id] || []}
                            onPermissionChange={handlePermissionChange}
                          />
                        </TabsContent>

                        <TabsContent value="audit">
                          <AuditTrailView entityType="role_permission" entityId={role.id.toString()} />
                        </TabsContent>
                      </Tabs>
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
