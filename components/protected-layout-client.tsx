"use client"

import type React from "react"

import { RoleSwitcherPanel } from "@/components/role-switcher-panel"

export function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RoleSwitcherPanel />
    </>
  )
}
