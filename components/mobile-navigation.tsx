"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import SidebarNavigation from "./sidebar-navigation"
import { useCurrentUser } from "@/hooks/use-current-user"

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const { user } = useCurrentUser()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px]">
        <div className="flex flex-col h-full">
          <div className="border-b p-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {user?.firstName && user?.lastName 
                ? `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}'S WORKSPACE` 
                : user?.username 
                  ? `${user.username.toUpperCase()}'S WORKSPACE` 
                  : 'WORKSPACE'}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto flex-1">
            <SidebarNavigation />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
