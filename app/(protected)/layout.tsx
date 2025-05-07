import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, Building2, Users, BarChart } from "lucide-react"
import AuthCheck from "@/components/auth-check"

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

      {/* Static Header with Hardcoded Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-lg mr-8">
              Photography Portal
            </Link>

            {/* Hardcoded Navigation Links */}
            <nav className="flex items-center space-x-6">
              <Link href="/" className="flex items-center text-sm font-medium transition-colors hover:text-primary">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/organization"
                className="flex items-center text-sm font-medium transition-colors hover:text-primary"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Organization
              </Link>
              <Link
                href="/people"
                className="flex items-center text-sm font-medium transition-colors hover:text-primary"
              >
                <Users className="mr-2 h-4 w-4" />
                People
              </Link>
              <Link
                href="/sales"
                className="flex items-center text-sm font-medium transition-colors hover:text-primary"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Sales
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-right">
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
