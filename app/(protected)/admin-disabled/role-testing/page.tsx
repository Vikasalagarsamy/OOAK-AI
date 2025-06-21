"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Shield, 
  Building, 
  Users, 
  TrendingUp, 
  Settings,
  Eye,
  EyeOff,
  LogIn,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react"

interface TestUser {
  username: string
  role: string
  expectedAccess: string
  menuAccess: string[]
  accessLevel: string
}

interface MenuPermissions {
  user: any
  role: string
  authenticated: boolean
  menu: any
  permissions: any
}

export default function RoleTestingPage() {
  const [testUsers, setTestUsers] = useState<TestUser[]>([])
  const [currentPermissions, setCurrentPermissions] = useState<MenuPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadTestData = async () => {
    try {
      console.log("🎭 Loading role testing data...")
      
      // Load available test users
      const usersResponse = await fetch("/api/auth/test-roles")
      const usersData = await usersResponse.json()
      
      if (usersData.success) {
        setTestUsers(usersData.users || [])
      }
      
      // Load current user's permissions
      const permissionsResponse = await fetch("/api/auth/menu-permissions")
      const permissionsData = await permissionsResponse.json()
      
      if (permissionsData.success) {
        setCurrentPermissions(permissionsData)
      }
      
    } catch (error) {
      console.error("❌ Failed to load test data:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshPermissions = async () => {
    setRefreshing(true)
    try {
      const response = await fetch("/api/auth/menu-permissions")
      const data = await response.json()
      
      if (data.success) {
        setCurrentPermissions(data)
      }
    } catch (error) {
      console.error("❌ Failed to refresh permissions:", error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTestData()
  }, [])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-red-100 text-red-800'
      case 'Admin Head': return 'bg-orange-100 text-orange-800'
      case 'Sales Head': return 'bg-blue-100 text-blue-800'
      case 'Sales Manager': return 'bg-green-100 text-green-800'
      case 'Sales Executive': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccessLevelColor = (level: string) => {
    if (level.includes('Admin')) return 'destructive'
    if (level.includes('Head')) return 'default'
    if (level.includes('Manager')) return 'secondary'
    return 'outline'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading role testing data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Role-Based Menu Testing</h1>
            <p className="text-gray-600">Test menu permissions and access control for different user roles</p>
          </div>
          <Button 
            onClick={refreshPermissions} 
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <Tabs defaultValue="current-user" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="current-user">Current User</TabsTrigger>
            <TabsTrigger value="test-users">Test Users</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="current-user">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Current User Permissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentPermissions ? (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {currentPermissions.authenticated ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className={`font-medium ${currentPermissions.authenticated ? 'text-green-700' : 'text-red-700'}`}>
                            {currentPermissions.authenticated ? 'Authenticated' : 'Not Authenticated'}
                          </span>
                        </div>
                        {currentPermissions.user && (
                          <div>
                            <span className="font-medium">{currentPermissions.user.name || currentPermissions.user.username}</span>
                            <Badge className={`ml-2 ${getRoleColor(currentPermissions.role)}`}>
                              {currentPermissions.role}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Available Menus */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Available Menu Items</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(currentPermissions.menu).map(([key, menu]: [string, any]) => (
                          <Card key={key} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-medium">{menu.label}</span>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">{menu.path}</div>
                              {menu.children && (
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">Submenus:</div>
                                  {menu.children.map((child: any, index: number) => (
                                    <div key={index} className="text-xs text-gray-600 ml-4">
                                      • {child.label} {child.readonly && <span className="text-orange-500">(Read-only)</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Permissions Summary */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Permission Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(currentPermissions.permissions).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center space-x-2">
                            {value ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${value ? 'text-green-700' : 'text-red-700'}`}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No permission data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test-users">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Test Users</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Administrator (Full Access)</h4>
                  <p className="text-sm text-gray-600">Username: <code>admin</code></p>
                  <p className="text-sm text-gray-600">Password: <code>admin123</code></p>
                  <p className="text-xs mt-2">Access: All menus (Organization, People, Sales, Admin)</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Admin Head (High-Level Admin)</h4>
                  <p className="text-sm text-gray-600">Username: <code>manager</code></p>
                  <p className="text-sm text-gray-600">Password: <code>admin123</code></p>
                  <p className="text-xs mt-2">Access: Organization + People (no Admin section)</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Sales Head (Department Manager)</h4>
                  <p className="text-sm text-gray-600">Username: <code>durga.ooak</code></p>
                  <p className="text-sm text-gray-600">Password: <code>Password not found - try common passwords</code></p>
                  <p className="text-xs mt-2">Access: Sales + People (view-only), no Organization</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Sales Manager (Team Lead)</h4>
                  <p className="text-sm text-gray-600">Username: <code>rasvickys</code></p>
                  <p className="text-sm text-gray-600">Password: <code>admin123</code></p>
                  <p className="text-xs mt-2">Access: Sales with team management features</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Sales Executive (Individual Contributor)</h4>
                  <p className="text-sm text-gray-600">Username: <code>deepikadevimurali</code></p>
                  <p className="text-sm text-gray-600">Password: <code>admin123</code></p>
                  <p className="text-xs mt-2">Access: Limited Sales menu (own leads only)</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Sales Executive (Alternative)</h4>
                  <p className="text-sm text-gray-600">Username: <code>pradeep</code></p>
                  <p className="text-sm text-gray-600">Password: <code>Password not found - try common passwords</code></p>
                  <p className="text-xs mt-2">Access: Limited Sales menu (own leads only)</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800">Testing Instructions:</h4>
                <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>Log out of your current session</li>
                  <li>Go to <code>/login</code></li>
                  <li>Use any of the credentials above</li>
                  <li>Navigate the menu system to test permissions</li>
                  <li>Try accessing restricted areas for each role</li>
                </ol>
              </div>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800">✅ Working Test Accounts:</h4>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• <strong>admin</strong> (Administrator) - Password: admin123</li>
                  <li>• <strong>manager</strong> (Admin Head) - Password: admin123</li>
                  <li>• <strong>rasvickys</strong> (Sales Manager) - Password: admin123</li>
                  <li>• <strong>deepikadevimurali</strong> (Sales Executive) - Password: admin123</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="instructions">
            <Card>
              <CardHeader>
                <CardTitle>How to Test Role-Based Menu Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This testing system allows you to verify that menu permissions work correctly for different user roles.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">🎯 Testing Steps:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Note your current role and permissions in the "Current User" tab</li>
                      <li>Check the "Test Users" tab to see available test accounts</li>
                      <li>Open a new browser tab/window and go to <code className="bg-gray-100 px-1 rounded">/login</code></li>
                      <li>Login with any test user (password: <code className="bg-gray-100 px-1 rounded">admin123</code>)</li>
                      <li>Observe how the menu structure changes based on the user's role</li>
                      <li>Try accessing different sections to verify permissions</li>
                      <li>Return to this page to refresh and see the new user's permissions</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">🔍 What to Look For:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Administrator:</strong> Should see all menus (Organization, People, Sales, Admin)</li>
                      <li><strong>Admin Head:</strong> Should see Organization, People, but no Admin section</li>
                      <li><strong>Sales Head:</strong> Should see Sales + People (view-only), no Organization</li>
                      <li><strong>Sales Manager:</strong> Should see Sales with team management features</li>
                      <li><strong>Sales Executive:</strong> Should see limited Sales menu (own leads only)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">🛡️ Security Testing:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Try directly accessing restricted URLs (e.g., <code className="bg-gray-100 px-1 rounded">/admin</code> as Sales Executive)</li>
                      <li>Verify that restricted actions are blocked in the UI</li>
                      <li>Check that data APIs respect role permissions</li>
                      <li>Ensure users only see data they should have access to</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 