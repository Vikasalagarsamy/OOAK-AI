import type React from "react"
import { Header } from "@/components/header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  )
}
