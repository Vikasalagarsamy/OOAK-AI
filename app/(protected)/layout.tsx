import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"

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
      {/* Main Content - Static navigation is now in the root layout */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs />
        <main>{children}</main>
      </div>
    </div>
  )
}
