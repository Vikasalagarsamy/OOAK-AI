"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase-browser"
import { useMenu } from "@/hooks/use-menu"

export function MenuDebugger() {
  const [activeTab, setActiveTab] = useState("database")
  const [databaseData, setDatabaseData] = useState<any>(null)
  const [apiData, setApiData] = useState<any>(null)
  const [renderedData, setRenderedData] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const { menu: menuData, loading: menuLoading, error: menuError } = useMenu()

  // Fetch database data directly
  const fetchDatabaseData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch current user info
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Get user's role from user_accounts table
      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .select("role_id, username, email")
        .eq("user_id", userData.user?.id)
        .single()

      if (accountError) throw accountError

      // Get role details
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id, title")
        .eq("id", accountData.role_id)
        .single()

      if (roleError) throw roleError

      // Fetch menu items
      const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("*").order("sort_order")

      if (menuError) throw menuError

      // Fetch permissions for this role
      const { data: permissions, error: permissionsError } = await supabase
        .from("role_menu_permissions")
        .select("*")
        .eq("role_id", accountData.role_id)

      if (permissionsError) throw permissionsError

      // Compile all the information
      setUserInfo({
        user_id: userData.user?.id,
        username: accountData.username,
        email: accountData.email,
        role_id: accountData.role_id,
        role_title: roleData.title,
      })

      setDatabaseData({
        menuItems,
        permissions,
      })
    } catch (err: any) {
      console.error("Database fetch error:", err)
      setError(err.message || "Failed to fetch database data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch data from the API endpoint
  const fetchApiData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/menu")
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }
      const data = await response.json()
      setApiData(data)
    } catch (err: any) {
      console.error("API fetch error:", err)
      setError(err.message || "Failed to fetch API data")
    } finally {
      setLoading(false)
    }
  }

  // Simulate the rendered menu data
  const fetchRenderedData = async () => {
    setLoading(true)
    setError(null)
    try {
      // This mimics what the menu component would render
      // const menu = await import("@/hooks/use-menu")
      // const { menu: menuData, loading, error } = menu.useMenu()

      // We can't actually use the hook directly here, so let's fetch the API data again
      // const response = await fetch("/api/menu")
      // if (!response.ok) {
      //   throw new Error(`API returned status ${response.status}`)
      // }

      // const data = await response.json()

      // Process the data as the component would
      const processed = {
        menuItems: menuData,
        renderedItemCount: countRenderedItems(menuData),
      }

      setRenderedData(processed)
    } catch (err: any) {
      console.error("Render simulation error:", err)
      setError(err.message || "Failed to simulate rendered data")
    } finally {
      setLoading(false)
    }
  }

  // Helper to count items that would be rendered
  const countRenderedItems = (items: any[]) => {
    let count = 0

    const countRecursive = (items: any[]) => {
      if (!items) return

      for (const item of items) {
        count++
        if (item.children && item.children.length > 0) {
          countRecursive(item.children)
        }
      }
    }

    countRecursive(items)
    return count
  }

  // Load initial data
  useEffect(() => {
    if (activeTab === "database") {
      fetchDatabaseData()
    } else if (activeTab === "api") {
      fetchApiData()
    } else if (activeTab === "rendered") {
      fetchRenderedData()
    }
  }, [activeTab])

  const renderDataSection = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    if (activeTab === "database" && databaseData) {
      return (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">User Information</h3>
            <pre className="text-sm overflow-auto p-2 bg-background rounded border">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Menu Items ({databaseData.menuItems?.length || 0})</h3>
            <pre className="text-sm overflow-auto max-h-[300px] p-2 bg-background rounded border">
              {JSON.stringify(databaseData.menuItems, null, 2)}
            </pre>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Role Permissions ({databaseData.permissions?.length || 0})</h3>
            <pre className="text-sm overflow-auto max-h-[300px] p-2 bg-background rounded border">
              {JSON.stringify(databaseData.permissions, null, 2)}
            </pre>
          </div>

          {databaseData.menuItems?.length > 0 && databaseData.permissions?.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permission Issue Detected</AlertTitle>
              <AlertDescription>
                No permissions found for your role (ID: {userInfo?.role_id}). This is likely the cause of missing menu
                items.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )
    }

    if (activeTab === "api" && apiData) {
      return (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">API Response - Menu Items ({apiData.length || 0})</h3>
            <pre className="text-sm overflow-auto max-h-[500px] p-2 bg-background rounded border">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>

          {apiData.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Issue Detected</AlertTitle>
              <AlertDescription>
                The API returned an empty menu. This indicates either a permission issue or the menu isn't being
                correctly filtered.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )
    }

    if (activeTab === "rendered" && renderedData) {
      return (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Rendered Menu Data</h3>
            <p className="text-sm mb-4">Items that would be rendered in the UI: {renderedData.renderedItemCount}</p>
            <pre className="text-sm overflow-auto max-h-[500px] p-2 bg-background rounded border">
              {JSON.stringify(renderedData.menuItems, null, 2)}
            </pre>
          </div>

          {renderedData.renderedItemCount === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Rendering Issue Detected</AlertTitle>
              <AlertDescription>
                No menu items would be rendered despite data being available. This suggests a problem in the menu
                component rendering logic.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )
    }

    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>Select a tab and refresh to view data.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu System Debugger</CardTitle>
        <CardDescription>
          Investigate why menu items are not rendering correctly based on role permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="database">Database Data</TabsTrigger>
              <TabsTrigger value="api">API Response</TabsTrigger>
              <TabsTrigger value="rendered">Rendered Output</TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "database") fetchDatabaseData()
                else if (activeTab === "api") fetchApiData()
                else if (activeTab === "rendered") fetchRenderedData()
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <TabsContent value="database">{renderDataSection()}</TabsContent>

          <TabsContent value="api">{renderDataSection()}</TabsContent>

          <TabsContent value="rendered">{renderDataSection()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
