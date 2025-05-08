"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase-browser"
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

  const supabase = createClient()

  // Load users and paths when component mounts
  useState(() => {
    async function loadData() {
      try {
        setLoadingUsers(true)
        const { data: users, error: usersError } = await supabase
          .from("user_accounts")
          .select("id, username, email")
          .eq("is_active", true)
          .order("username")

        if (usersError) throw usersError
        setAvailableUsers(users || [])

        setLoadingPaths(true)
        const { data: paths, error: pathsError } = await supabase
          .from("menu_items")
          .select("id, path, name")
          .not("path", "is", null)
          .order("name")

        if (pathsError) throw pathsError
        setAvailablePaths(paths || [])
      } catch (error) {
        console.error("Error loading data:", error)
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
      const { data, error } = await supabase.rpc("check_user_menu_permission", {
        p_user_id: userId,
        p_menu_path: menuPath,
        p_permission: permission,
      })

      if (error) throw error

      setResult(data)
      toast({
        title: "Test completed",
        description: data
          ? `User has ${permission} permission for ${menuPath}`
          : `User does NOT have ${permission} permission for ${menuPath}`,
      })
    } catch (error) {
      console.error("Error testing permission:", error)
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
                      <SelectItem key={user.id} value={user.id}>
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
