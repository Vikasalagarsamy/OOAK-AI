import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reports | ONE OF A KIND PORTAL",
  description: "Analytics and reporting dashboards",
}

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      {children}
    </div>
  )
}
