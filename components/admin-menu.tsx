"use client"

import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Settings, Shield, Wrench, Bug, CheckCircle } from "lucide-react"

export function AdminMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Administration</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/admin/menu-permissions" className="flex items-center w-full">
            <Settings className="mr-2 h-4 w-4" />
            <span>Menu Permissions</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/role-permissions" className="flex items-center w-full">
            <Shield className="mr-2 h-4 w-4" />
            <span>Role Permissions</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/menu-repair" className="flex items-center w-full">
            <Wrench className="mr-2 h-4 w-4" />
            <span>Menu Repair</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/menu-debug" className="flex items-center w-full">
            <Bug className="mr-2 h-4 w-4" />
            <span>Menu Debug</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/test-permissions" className="flex items-center w-full">
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Test Permissions</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
