"use client"

import { useEffect } from "react"
import { DesktopMenu } from "./desktop-menu"
import { MobileMenu } from "./mobile-menu"

export function DynamicMenu({ className }: { className?: string }) {
  // Add console log to check if component is rendering
  useEffect(() => {
    console.log("DynamicMenu component mounted")
  }, [])

  return (
    <div className="flex items-center">
      <DesktopMenu className={className} />
      <MobileMenu className={className} />
    </div>
  )
}
