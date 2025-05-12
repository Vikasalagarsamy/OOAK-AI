"use client"

import type React from "react"

import { RoleProvider } from "@/contexts/role-context"

export default function RoleTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoleProvider>{children}</RoleProvider>
}
