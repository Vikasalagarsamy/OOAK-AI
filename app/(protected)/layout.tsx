import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { Toaster } from "@/components/toaster"
import { RoleProvider } from "@/contexts/role-context"
import { RouteProtector } from "@/components/route-protector"

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
      <RoleProvider>
        <RouteProtector>
          <Header />
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar navigation - always visible on desktop */}
            <div className="hidden md:block w-64 border-r bg-background overflow-auto">
              <SidebarNavigation />
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                <Breadcrumbs />
                <main>{children}</main>
              </div>
            </div>
          </div>
          <Toaster />
        </RouteProtector>
      </RoleProvider>
    </div>
  )
}
