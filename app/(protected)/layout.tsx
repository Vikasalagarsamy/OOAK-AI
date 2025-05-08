import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, Shield, Wrench, Bug, CheckCircle } from "lucide-react"
import AuthCheck from "@/components/auth-check"
import { NavigationMenu } from "@/components/navigation-menu"
import { MobileNavigation } from "@/components/mobile-navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?reason=unauthenticated")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AuthCheck />

      {/* Enhanced Header with Hover-based Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center flex-1">
            <MobileNavigation />
            <Link href="/" className="font-bold text-lg mr-8">
              ONE OF A KIND PORTAL
            </Link>

            {/* Desktop Navigation Menu Component with hover-based submenus */}
            <NavigationMenu />
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">Role: {user.roleName || "Administrator"}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">Role: {user.roleName || "Administrator"}</p>
                    </div>
                    <DropdownMenuSeparator />

                    {/* Admin Menu Items */}
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Administration</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/menu-permissions">
                          <Settings className="mr-2 h-4 w-4" />
                          Menu Permissions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/role-permissions">
                          <Shield className="mr-2 h-4 w-4" />
                          Role Permissions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/menu-repair">
                          <Wrench className="mr-2 h-4 w-4" />
                          Menu Repair
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/menu-debug">
                          <Bug className="mr-2 h-4 w-4" />
                          Menu Debug
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/test-permissions">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Test Permissions
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <form action="/api/auth/logout" method="post" className="w-full">
                        <Button variant="ghost" size="sm" type="submit" className="w-full justify-start">
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
