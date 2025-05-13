import type React from "react"
import { MainLayout } from "@/components/main-layout"

export default function FollowUpsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
