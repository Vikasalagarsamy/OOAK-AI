import type React from "react"
import { HeaderWithMobileNav } from "@/components/header-with-mobile-nav"
import { MainNav } from "@/components/navigation/main-nav"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWithMobileNav />
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-background md:block">
          <div className="flex h-full flex-col">
            <MainNav className="flex-1 overflow-auto py-4" />
          </div>
        </aside>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
