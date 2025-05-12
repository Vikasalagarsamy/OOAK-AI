"use client"

import { useState } from "react"
import { useRole } from "@/contexts/role-context"
import { ChevronUp, ChevronDown, Shield, ShieldAlert, ShieldCheck, CircleUser } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentRole, setCurrentRole, availableRoles } = useRole()

  // Helper function to get the appropriate icon for each role
  const getRoleIcon = (role: typeof currentRole) => {
    if (role.isAdmin) return <ShieldAlert className="h-4 w-4 text-red-500" />
    if (role.id === "manager") return <ShieldCheck className="h-4 w-4 text-green-500" />
    if (role.id === "hr") return <Shield className="h-4 w-4 text-blue-500" />
    return <CircleUser className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-white shadow-md border" onClick={() => setIsOpen(!isOpen)}>
            <div className="flex items-center gap-2">
              {getRoleIcon(currentRole)}
              <span>Role: {currentRole.name}</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableRoles.map((role) => (
            <DropdownMenuItem
              key={role.id}
              className={`cursor-pointer ${role.id === currentRole.id ? "bg-muted" : ""}`}
              onClick={() => {
                setCurrentRole(role)
                setIsOpen(false)
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {getRoleIcon(role)}
                  <span>{role.name}</span>
                </div>
                {role.isAdmin && (
                  <Badge variant="destructive" className="text-xs">
                    Admin
                  </Badge>
                )}
                {role.id === currentRole.id && (
                  <Badge variant="outline" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
