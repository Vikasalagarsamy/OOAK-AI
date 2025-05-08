import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import AuthCheck from "@/components/auth-check"
import { NavigationMenu } from "@/components/navigation-menu"
import { MobileNavigation } from "@/components/mobile-navigation"
import { AdminMenu } from "@/components/admin-menu"

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

                {/* Admin Menu */}
                <AdminMenu />
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
