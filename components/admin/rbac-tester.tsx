"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { clearPermissionCache } from "@/lib/permission-utils"

interface Role {
  id: number
  title: string
}

interface MenuItem {
  id: number
  name: string
  path: string | null
  parent_id: number | null
}

interface AccessTest {
  menuItem: MenuItem
  hasAccess: boolean
  loading: boolean
}

export function RbacTester() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [accessTests, setAccessTests] = useState<AccessTest[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        setError(null)
        const { data, error } = await supabase.from("roles").select("id, title").order("title")

        if (error) throw error

        setRoles(data || [])
        if (data && data.length > 0) {
          // Find the sales head role if it exists
          const salesHeadRole = data.find((role) => role.title.toLowerCase() === "sales head")
          if (salesHeadRole) {
            setSelectedRole(salesHeadRole.id)
          } else {
            setSelectedRole(data[0].id)
          }
        }
      } catch (error: any) {
        console.error("Error loading roles:", error)
        setError(`Failed to load roles: ${error.message}`)
      }
    }

    loadRoles()
  }, [])

  // Load menu items
  useEffect(() => {
    async function loadMenuItems() {
      try {
        setError(null)
        const { data, error } = await supabase.from("menu_items").select("id, name, path, parent_id").order("id")

        if (error) throw error

        // Filter out items without paths
        const filteredItems = (data || []).filter((item) => item.path)
        setMenuItems(filteredItems)
      } catch (error: any) {
        console.error("Error loading menu items:", error)
        setError(`Failed to load menu items: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadMenuItems()
  }, [])

  // Run access tests for selected role
  const runAccessTests = async () => {
    if (!selectedRole) return

    setTesting(true)
    clearPermissionCache() // Clear cache before testing

    // Initialize tests
    const tests = menuItems.map((item) => ({
      menuItem: item,
      hasAccess: false,
      loading: true,
    }))

    setAccessTests(tests)

    // Run tests in parallel
    const testPromises = menuItems.map(async (item, index) => {
      try {
        // Get permissions for this menu item
        const { data, error } = await supabase
          .from("role_menu_permissions")
          .select("can_view")
          .eq("role_id", selectedRole)
          .eq("menu_item_id", item.id)
          .single()

        const hasAccess = !error && data && data.can_view

        // Update the test result
        setAccessTests((prev) => {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            hasAccess,
            loading: false,
          }
          return updated
        })

        return { menuItem: item, hasAccess, loading: false }
      } catch (error) {
        console.error(`Error testing access for menu item ${item.name}:`, error)

        // Update with error state
        setAccessTests((prev) => {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            hasAccess: false,
            loading: false,
          }
          return updated
        })

        return { menuItem: item, hasAccess: false, loading: false }
      }
    })

    await Promise.all(testPromises)
    setTesting(false)

    toast({
      title: "Access Tests Completed",
      description: `Tested access for ${menuItems.length} menu items`,
    })
  }

  // Get the name of the selected role
  const getSelectedRoleName = () => {
    if (!selectedRole) return ""
    const role = roles.find((r) => r.id === selectedRole)
    return role ? role.title : ""
  }

  // Check if a path is administrative
  const isAdminPath = (path: string | null) => {
    if (!path) return false
    return (
      path.startsWith("/admin") ||
      path.startsWith("/organization/roles") ||
      path.startsWith("/organization/account-creation")
    )
  }

  // Group test results by category
  const getGroupedResults = () => {
    const adminTests = accessTests.filter((test) => isAdminPath(test.menuItem.path))
    const nonAdminTests = accessTests.filter((test) => !isAdminPath(test.menuItem.path))

    const adminAccessCount = adminTests.filter((test) => test.hasAccess).length
    const nonAdminAccessCount = nonAdminTests.filter((test) => test.hasAccess).length

    return {
      adminTests,
      nonAdminTests,
      adminAccessCount,
      nonAdminAccessCount,
      totalAdminTests: adminTests.length,
      totalNonAdminTests: nonAdminTests.length,
    }
  }

  const groupedResults = getGroupedResults()
  const selectedRoleName = getSelectedRoleName()
  const isSalesHead = selectedRoleName.toLowerCase() === "sales head"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Access Control Tester</CardTitle>
          <CardDescription>Test and verify access permissions for different roles</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="text-center py-4">Loading roles and menu items...</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-64">
                  <Select value={selectedRole?.toString()} onValueChange={(value) => setSelectedRole(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={runAccessTests} disabled={!selectedRole || testing}>
                  {testing ? "Testing..." : "Test Access Permissions"}
                </Button>
              </div>

              {accessTests.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">Administrative Access</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {groupedResults.adminAccessCount} / {groupedResults.totalAdminTests}
                        </div>
                        <p className="text-sm text-muted-foreground">Administrative menus accessible</p>

                        {isSalesHead && groupedResults.adminAccessCount > 0 && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Security Issue</AlertTitle>
                            <AlertDescription>
                              Sales Head role should not have access to administrative menus!
                            </AlertDescription>
                          </Alert>
                        )}

                        {isSalesHead && groupedResults.adminAccessCount === 0 && (
                          <Alert variant="success" className="mt-4 bg-green-50 border-green-200 text-green-800">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle>Correct Configuration</AlertTitle>
                            <AlertDescription>
                              Sales Head role correctly restricted from administrative menus.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">Regular Access</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {groupedResults.nonAdminAccessCount} / {groupedResults.totalNonAdminTests}
                        </div>
                        <p className="text-sm text-muted-foreground">Regular menus accessible</p>

                        {isSalesHead && groupedResults.nonAdminAccessCount === 0 && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Configuration Issue</AlertTitle>
                            <AlertDescription>Sales Head role has no access to any regular menus!</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Menu Item</TableHead>
                          <TableHead>Path</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accessTests.map((test) => (
                          <TableRow key={test.menuItem.id}>
                            <TableCell>{test.menuItem.name}</TableCell>
                            <TableCell className="font-mono text-xs">{test.menuItem.path}</TableCell>
                            <TableCell>
                              {isAdminPath(test.menuItem.path) ? (
                                <span className="text-amber-600 font-medium">Administrative</span>
                              ) : (
                                <span className="text-emerald-600 font-medium">Regular</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {test.loading ? (
                                <span className="text-muted-foreground">Testing...</span>
                              ) : test.hasAccess ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" /> Allowed
                                </span>
                              ) : (
                                <span className="flex items-center text-red-600">
                                  <XCircle className="h-4 w-4 mr-1" /> Denied
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
