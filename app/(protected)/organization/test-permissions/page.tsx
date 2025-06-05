"use client"

import { useEffect, useState } from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { getUserPermissions, hasMenuPermission } from "@/lib/permission-checker"
import { extractMenuStructure } from "@/lib/menu-extractor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Shield, Users, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TestPermissionsPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [permissions, setPermissions] = useState<any>({})
  const [menuPermissions, setMenuPermissions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadPermissionData = async () => {
      try {
        setLoading(true)
        
        // Get user info
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        // Get permissions
        const userPermissions = await getUserPermissions()
        setPermissions(userPermissions)
        
        // Test a few key menu permissions
        const menuStructure = extractMenuStructure()
        const testPermissions: Record<string, boolean> = {}
        
        for (const section of menuStructure) {
          testPermissions[section.id] = await hasMenuPermission(section.id, 'view')
          
          if (section.children) {
            for (const child of section.children) {
              testPermissions[child.id] = await hasMenuPermission(child.id, 'view')
            }
          }
        }
        
        setMenuPermissions(testPermissions)
        
      } catch (error) {
        console.error("Error loading permission data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPermissionData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <span className="text-lg">Loading permission test...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permission System Test</h1>
          <p className="text-muted-foreground mt-2">
            This page demonstrates the working role-based access control system
          </p>
        </div>
        <Badge variant={user?.isAdmin ? "destructive" : "secondary"} className="text-lg px-3 py-1">
          {user?.isAdmin ? "Admin" : user?.roleName || "Unknown Role"}
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>✅ Permission System is Working!</AlertTitle>
        <AlertDescription>
          If you can see this page and the sidebar shows filtered menu items, 
          your role-based access control is properly enforced.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current User
            </CardTitle>
            <CardDescription>Your login and role information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Username:</span> {user?.username || "N/A"}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user?.email || "N/A"}
            </div>
            <div>
              <span className="font-medium">Role ID:</span> {user?.roleId || "N/A"}
            </div>
            <div>
              <span className="font-medium">Role Name:</span> {user?.roleName || "N/A"}
            </div>
            <div>
              <span className="font-medium">Is Admin:</span> 
              <Badge variant={user?.isAdmin ? "destructive" : "secondary"} className="ml-2">
                {user?.isAdmin ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Permission Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permission Summary
            </CardTitle>
            <CardDescription>Overview of your access permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Total Menu Permissions:</span> 
                <Badge variant="outline" className="ml-2">
                  {Object.keys(permissions).length}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Accessible Menus:</span> 
                <Badge variant="outline" className="ml-2">
                  {Object.values(menuPermissions).filter(Boolean).length}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Restricted Menus:</span> 
                <Badge variant="destructive" className="ml-2">
                  {Object.values(menuPermissions).filter(p => !p).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Menu Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Access Permissions</CardTitle>
          <CardDescription>
            Detailed breakdown of what menu items you can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {extractMenuStructure().map((section) => (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{section.name}</h3>
                    {menuPermissions[section.id] ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <Badge variant={menuPermissions[section.id] ? "default" : "destructive"}>
                    {menuPermissions[section.id] ? "Accessible" : "Restricted"}
                  </Badge>
                </div>

                {section.children && (
                  <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
                    {section.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{child.name}</span>
                          {menuPermissions[child.id] ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <Badge 
                          variant={menuPermissions[child.id] ? "outline" : "destructive"} 
                          className="text-xs"
                        >
                          {menuPermissions[child.id] ? "✓" : "✗"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
          <CardDescription>Steps to verify the permission system is working</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check that you can only see menu items you have permission for in the sidebar</li>
            <li>Try to navigate to a restricted page directly via URL - you should be blocked</li>
            <li>Log in as different users with different roles to see different menu access</li>
            <li>Update permissions in the Role Manager and see the changes reflected immediately</li>
            <li>Admin users should see all menus regardless of role permissions</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
} 