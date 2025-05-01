import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "View and search system audit logs",
}

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex-1">{children}</div>
}
