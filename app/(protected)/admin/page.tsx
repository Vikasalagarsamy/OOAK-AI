import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Settings, Database, BarChart } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Administrative tools and system management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Menu Permissions Manager */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Menu Permissions
            </CardTitle>
            <CardDescription>
              Control role-based access to menu items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/menu-permissions">
              <Button className="w-full">
                Manage Menu Access
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage users, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/organization/user-accounts">
              <Button variant="outline" className="w-full">
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Role Management
            </CardTitle>
            <CardDescription>
              Configure roles and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/organization/roles">
              <Button variant="outline" className="w-full">
                Manage Roles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Role-Based Access Control (RBAC)
        </h3>
        <p className="text-sm text-muted-foreground">
          Your application now has enterprise-grade role-based menu access control.
          Use the Menu Permissions manager above to control which menu items each role can access.
          Changes are applied immediately through the enterprise menu system.
        </p>
      </div>
    </div>
  )
} 