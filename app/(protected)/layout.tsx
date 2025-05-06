import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
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
    <div>
      <AuthCheck />
      {children}
    </div>
  )
}
