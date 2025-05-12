import type React from "react"
import { Header } from "@/components/header"
import { DynamicMenu } from "@/components/dynamic-menu/dynamic-menu"
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
      <div className="flex flex-1">
        <DynamicMenu />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
