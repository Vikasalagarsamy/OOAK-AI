import type React from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { Toaster } from "@/components/toaster"

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
    <MainLayout>
      {children}
      <Toaster />
    </MainLayout>
  )
}
