"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Breadcrumbs } from "@/components/breadcrumbs"
import SidebarNavigation from "@/components/sidebar-navigation"
import { Toaster } from "@/components/ui/toaster"
import { UltraFastAuthProvider } from "@/components/ultra-fast-auth-provider"
import { AuthCheckFixed } from "@/components/auth-check-fixed"

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AuthCheckFixed>
      <div className="min-h-screen bg-background">
        <UltraFastAuthProvider>
          <div className="flex min-h-screen">
            <div className="w-80 flex-shrink-0">
              <SidebarNavigation className="h-full" />
            </div>
            <div className="flex-1 overflow-x-hidden">
              <Header />
              <main className="p-6">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </UltraFastAuthProvider>
      </div>
    </AuthCheckFixed>
  )
}
