import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Area | Company Management System",
  description: "Administrative area for system management",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col min-h-screen">{children}</div>
    </div>
  )
}
