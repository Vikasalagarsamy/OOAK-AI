"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useEnhancedMenu } from "@/hooks/use-enhanced-menu"
import { MenuIcon } from "@/components/dynamic-menu/menu-icon"
import { AlertCircle, RefreshCw } from "lucide-react"

export function MenuDebugView() {
  // Initialize with empty array to prevent undefined errors
  const { menu = [], loading, error, refreshMenu, lastRefresh } = useEnhancedMenu()
  const [showFullData, setShowFullData] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshMenu()
    setTimeout(() => setIsRefreshing(false), 500) // Show spinner for at least 500ms
  }

  // Filter menu items based on tab - with null checks
  const getFilteredMenuItems = () => {
    // Ensure menu is an array
    const safeMenu = Array.isArray(menu) ? menu : []

    if (activeTab === "all") return safeMenu
    if (activeTab === "topLevel") return safeMenu.filter((item) => item?.parentId === null)
    if (activeTab === "withChildren") return safeMenu.filter((item) => item?.children && item.children.length > 0)
    if (activeTab === "withoutChildren") return safeMenu.filter((item) => !item?.children || item.children.length === 0)
    if (activeTab === "withPath") return safeMenu.filter((item) => item?.path && item.path.length > 0)
    if (activeTab === "withoutPath") return safeMenu.filter((item) => !item?.path || item.path.length === 0)
    return safeMenu
  }

  // Render a menu item with its children - with null checks
  const renderMenuItem = (item: any, depth = 0) => {
    if (!item) return null

    const hasViewPermission = item.permissions?.canView
    const hasAddPermission = item.permissions?.canAdd
    const hasEditPermission = item.permissions?.canEdit
    const hasDeletePermission = item.permissions?.canDelete

    return (
      <div key={item.id || `item-${depth}-${Math.random()}`} className="mb-2">
        <div className="flex items-center p-2 rounded hover:bg-gray-100" style={{ marginLeft: `${depth * 20}px` }}>
          <div className="flex items-center flex-1 gap-2">
            {item.icon && <MenuIcon name={item.icon} className="h-4 w-4" />}
            <span className={`font-medium ${!item.isVisible ? "text-gray-400" : ""}`}>
              {item.name || "Unnamed Item"}
            </span>
            {item.path && <span className="text-xs text-gray-500">{item.path}</span>}
            {!item.isVisible && <span className="text-xs bg-gray-200 px-2 py-1 rounded">Hidden</span>}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs rounded ${hasViewPermission ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}
            >
              View: {hasViewPermission ? "Yes" : "No"}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${hasAddPermission ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}
            >
              Add: {hasAddPermission ? "Yes" : "No"}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${hasEditPermission ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}
            >
              Edit: {hasEditPermission ? "Yes" : "No"}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${hasDeletePermission ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}
            >
              Delete: {hasDeletePermission ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {item.children && Array.isArray(item.children) && item.children.length > 0 && (
          <div>{item.children.map((child: any) => renderMenuItem(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  // Ensure we have a valid array for filtered items
  const filteredItems = getFilteredMenuItems() || []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Menu Debug View</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFullData(!showFullData)}>
            {showFullData ? "Hide Details" : "Show Full Data"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">Total Items:</span> {Array.isArray(menu) ? menu.length : 0}
            </div>
            <div>
              <span className="font-medium">Top-level Items:</span>{" "}
              {Array.isArray(menu) ? menu.filter((item) => item?.parentId === null).length : 0}
            </div>
            <div>
              <span className="font-medium">Last Refresh:</span>{" "}
              {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : "Never"}
            </div>
          </div>
        </div>

        {showFullData ? (
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96 border">
            {JSON.stringify(Array.isArray(menu) ? menu : [], null, 2)}
          </pre>
        ) : (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="topLevel">Top Level</TabsTrigger>
              <TabsTrigger value="withChildren">With Children</TabsTrigger>
              <TabsTrigger value="withoutChildren">Without Children</TabsTrigger>
              <TabsTrigger value="withPath">With Path</TabsTrigger>
              <TabsTrigger value="withoutPath">Without Path</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="border rounded-md">
                  {filteredItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No menu items found</div>
                  ) : (
                    <div className="p-2">{filteredItems.map((item) => renderMenuItem(item))}</div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
