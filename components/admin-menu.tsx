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
import { Settings, Database, Shield, Zap } from "lucide-react"

export function AdminMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8">
          <Settings className="h-4 w-4 mr-1" />
          Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-semibold">Quick Admin Access</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Essential Daily Tools */}
        <DropdownMenuItem asChild>
          <Link href="/admin/database-monitor" className="flex items-center w-full">
            <Database className="mr-2 h-4 w-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-medium">Database Monitor</span>
              <span className="text-xs text-muted-foreground">System health & performance</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/menu-permissions" className="flex items-center w-full">
            <Shield className="mr-2 h-4 w-4 text-green-600" />
            <div className="flex flex-col">
              <span className="font-medium">User Permissions</span>
              <span className="text-xs text-muted-foreground">Role & access management</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        {/* Quick Actions */}
        <DropdownMenuItem asChild>
          <Link href="/admin" className="flex items-center w-full text-muted-foreground">
            <Zap className="mr-2 h-4 w-4" />
            <span className="text-sm">View All Admin Tools</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
