"use client"

import { ToastProvider } from "@/components/ui/use-toast"
import { Toaster } from "@/components/toaster"
import type * as React from "react"

export function ToasterWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  )
}
