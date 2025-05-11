"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile menu when navigating to a new page
  if (pathname && open) {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] pr-0">
        <MainNav className="mt-8" />
      </SheetContent>
    </Sheet>
  )
}
