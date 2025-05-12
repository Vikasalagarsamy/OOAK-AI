import type React from "react"
import { Header } from "@/components/header"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { Breadcrumb } from "@/components/breadcrumb"
import AuthCheck from "@/components/auth-check"
import { Toaster } from "@/components/toaster"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthCheck />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNavigation />
        <main className="flex-1 overflow-auto p-6">
          <Breadcrumb />
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
