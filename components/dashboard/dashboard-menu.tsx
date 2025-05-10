"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEnhancedMenu } from "@/hooks/use-enhanced-menu"
import { MenuIcon } from "@/components/dynamic-menu/menu-icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from "lucide-react"

export function DashboardMenu() {
  const { menuItems, isLoading, error, isAuthenticated, refreshMenu } = useEnhancedMenu()
  const pathname = usePathname()

  // Group menu items by category
  const organizationItems = menuItems.filter(
    (item) =>
      item.path?.startsWith("/organization") ||
      item.name?.toLowerCase().includes("organization") ||
      item.name?.toLowerCase().includes("company") ||
      item.name?.toLowerCase().includes("branch"),
  )

  const peopleItems = menuItems.filter(
    (item) =>
      item.path?.startsWith("/people") ||
      item.name?.toLowerCase().includes("people") ||
      item.name?.toLowerCase().includes("employee") ||
      item.name?.toLowerCase().includes("staff"),
  )

  const salesItems = menuItems.filter(
    (item) =>
      item.path?.startsWith("/sales") ||
      item.name?.toLowerCase().includes("sales") ||
      item.name?.toLowerCase().includes("lead") ||
      item.name?.toLowerCase().includes("client"),
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col items-center justify-center space-y-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    )
  }

  // Error state with retry button
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Quick Navigation</h2>
          <Button variant="outline" size="sm" onClick={refreshMenu}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 flex items-center space-x-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-medium">Failed to load menu</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              {!isAuthenticated && (
                <p className="text-sm mt-2">
                  You may need to{" "}
                  <Link href="/login" className="font-medium underline">
                    log in
                  </Link>{" "}
                  to access all features.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Show default navigation even when there's an error */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <Link href="/dashboard">
            <Card className={pathname === "/dashboard" ? "border-primary" : ""}>
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                <MenuIcon name="layout-dashboard" className="h-8 w-8" />
                <span className="text-sm font-medium">Dashboard</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/organization">
            <Card className={pathname === "/organization" ? "border-primary" : ""}>
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                <MenuIcon name="building" className="h-8 w-8" />
                <span className="text-sm font-medium">Organization</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/people">
            <Card className={pathname === "/people" ? "border-primary" : ""}>
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                <MenuIcon name="users" className="h-8 w-8" />
                <span className="text-sm font-medium">People</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/sales">
            <Card className={pathname === "/sales" ? "border-primary" : ""}>
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                <MenuIcon name="trending-up" className="h-8 w-8" />
                <span className="text-sm font-medium">Sales</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    )
  }

  // Render menu with tabs
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Quick Navigation</h2>
        {!isAuthenticated && (
          <div className="text-sm text-muted-foreground">
            <Link href="/login" className="font-medium hover:underline">
              Log in for full access
            </Link>
          </div>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {menuItems.length > 0 ? (
              menuItems.map((item) => (
                <Link href={item.path || "#"} key={item.id}>
                  <Card className={pathname === item.path ? "border-primary" : ""}>
                    <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                      <MenuIcon name={item.icon || "circle"} className="h-8 w-8" />
                      <span className="text-sm font-medium text-center">{item.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No menu items available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="organization" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {organizationItems.length > 0 ? (
              organizationItems.map((item) => (
                <Link href={item.path || "#"} key={item.id}>
                  <Card className={pathname === item.path ? "border-primary" : ""}>
                    <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                      <MenuIcon name={item.icon || "building"} className="h-8 w-8" />
                      <span className="text-sm font-medium text-center">{item.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No organization menu items available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="people" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {peopleItems.length > 0 ? (
              peopleItems.map((item) => (
                <Link href={item.path || "#"} key={item.id}>
                  <Card className={pathname === item.path ? "border-primary" : ""}>
                    <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                      <MenuIcon name={item.icon || "users"} className="h-8 w-8" />
                      <span className="text-sm font-medium text-center">{item.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No people menu items available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {salesItems.length > 0 ? (
              salesItems.map((item) => (
                <Link href={item.path || "#"} key={item.id}>
                  <Card className={pathname === item.path ? "border-primary" : ""}>
                    <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                      <MenuIcon name={item.icon || "trending-up"} className="h-8 w-8" />
                      <span className="text-sm font-medium text-center">{item.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No sales menu items available</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
