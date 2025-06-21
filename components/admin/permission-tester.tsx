"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { toast } from "@/components/ui/use-toast"
import { Check, X } from "lucide-react"

export function PermissionTester() {
  const [userId, setUserId] = useState("")
  const [menuPath, setMenuPath] = useState("")
  const [permission, setPermission] = useState("view")
  const [result, setResult] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [availablePaths, setAvailablePaths] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingPaths, setLoadingPaths] = useState(true)

  // Load users and paths when component mounts
  useEffect(() => {
    async function loadData() {
      try {
        console.log('🔍 Loading users and menu paths...')
        
        setLoadingUsers(true)
        const usersResult = await query(`
          SELECT id, username, email 
          FROM user_accounts 
          WHERE is_active = true 
          ORDER BY username
        `)

        if (!usersResult.success) {
          throw new Error(`Failed to load users: ${usersResult.error}`)
        }

        setAvailableUsers(usersResult.data || [])
        console.log(`✅ Loaded ${usersResult.data?.length || 0} users`)

        setLoadingPaths(true)
        const pathsResult = await query(`
          SELECT id, path, name 
          FROM menu_items 
          WHERE path IS NOT NULL 
          ORDER BY name
        `)

        if (!pathsResult.success) {
          throw new Error(`Failed to load menu paths: ${pathsResult.error}`)
        }

        setAvailablePaths(pathsResult.data || [])
        console.log(`✅ Loaded ${pathsResult.data?.length || 0} menu paths`)
      } catch (error: any) {
        console.error("❌ Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load users or paths",
          variant: "destructive",
        })
      } finally {
        setLoadingUsers(false)
        setLoadingPaths(false)
      }
    }

    loadData()
  }, [])

  const testPermission = async () => {
    if (!userId || !menuPath) {
      toast({
        title: "Missing information",
        description: "Please select a user and a menu path",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log(`🔍 Testing ${permission} permission for user ${userId} on path ${menuPath}`)

      // Check user permission using PostgreSQL query
      const result = await query(`
        SELECT 
          CASE 
            WHEN $3 = 'view' THEN rmp.can_view
            WHEN $3 = 'add' THEN rmp.can_add
            WHEN $3 = 'edit' THEN rmp.can_edit
            WHEN $3 = 'delete' THEN rmp.can_delete
            ELSE false
          END as has_permission
        FROM user_accounts ua
        JOIN roles r ON ua.role_id = r.id
        JOIN role_menu_permissions rmp ON r.id = rmp.role_id
        JOIN menu_items mi ON rmp.menu_item_id = mi.id
        WHERE ua.id = $1 AND mi.path = $2 AND ua.is_active = true
      `, [Number.parseInt(userId), menuPath, permission])

      if (!result.success) {
        throw new Error(`Failed to test permission: ${result.error}`)
      }

      const hasPermission = result.data?.[0]?.has_permission || false
      setResult(hasPermission)

      toast({
        title: "Test completed",
        description: hasPermission
          ? `User has ${permission} permission for ${menuPath}`
          : `User does NOT have ${permission} permission for ${menuPath}`,
      })

      console.log(`✅ Permission test result: ${hasPermission}`)
    } catch (error: any) {
      console.error("❌ Error testing permission:", error)
      toast({
        title: "Error",
        description: "Failed to test permission",
        variant: "destructive",
      })
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Tester</CardTitle>
        <CardDescription>Test if a user has permission for a specific menu path</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">User</label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="p-2 text-center">Loading users...</div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Menu Path</label>
              <Select value={menuPath} onValueChange={setMenuPath}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a menu path" />
                </SelectTrigger>
                <SelectContent>
                  {loadingPaths ? (
                    <div className="p-2 text-center">Loading paths...</div>
                  ) : (
                    availablePaths.map((item) => (
                      <SelectItem key={item.id} value={item.path}>
                        {item.name} ({item.path})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Permission Type</label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger>
                <SelectValue placeholder="Select permission type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={testPermission} disabled={loading} className="w-full">
            {loading ? "Testing..." : "Test Permission"}
          </Button>

          {result !== null && (
            <div
              className={`mt-4 p-4 rounded-md ${
                result ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center">
                {result ? (
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <X className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className={result ? "text-green-700" : "text-red-700"}>
                  {result
                    ? `User has ${permission} permission for ${menuPath}`
                    : `User does NOT have ${permission} permission for ${menuPath}`}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
