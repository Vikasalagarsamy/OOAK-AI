import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
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
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <form action="/api/auth/logout" method="post">
                  <Button variant="ghost" size="sm" type="submit">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
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
