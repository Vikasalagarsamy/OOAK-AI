import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { EnhancedDynamicMenu } from "@/components/dynamic-menu/enhanced-dynamic-menu"

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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center">
          <EnhancedDynamicMenu />
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium">{user.username || user.email || "User"}</span>
              <span className="text-xs text-muted-foreground">({user.roleName || "User"})</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
