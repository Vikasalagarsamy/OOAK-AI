"use client"

import { DesktopMenu } from "./desktop-menu"
import { MobileMenu } from "./mobile-menu"

export function DynamicMenu({ className }: { className?: string }) {
  return (
    <>
      <DesktopMenu className={className} />
      <MobileMenu className={className} />
    </>
  )
}
