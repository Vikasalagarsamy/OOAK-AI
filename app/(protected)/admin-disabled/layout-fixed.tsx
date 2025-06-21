import type React from "react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { AdminLayoutWrapper } from "./_components/admin-layout-wrapper"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutWrapper>
      <Breadcrumbs />
      {children}
    </AdminLayoutWrapper>
  )
}
