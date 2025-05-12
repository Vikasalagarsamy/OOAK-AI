"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp, Shield, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"

type Role = {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

const availableRoles: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    icon: <Shield className="h-4 w-4 text-red-500" />,
    description: "Full access to all features",
  },
  {
    id: "manager",
    name: "Manager",
    icon: <Users className="h-4 w-4 text-blue-500" />,
    description: "Access to management features",
  },
  {
    id: "sales",
    name: "Sales Representative",
    icon: <User className="h-4 w-4 text-green-500" />,
    description: "Access to sales features",
  },
  {
    id: "employee",
    name: "Employee",
    icon: <User className="h-4 w-4 text-gray-500" />,
    description: "Limited access to basic features",
  },
]

export function SidebarRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role>(availableRoles[0])

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role)
    setIsOpen(false)
    // In a real application, you would update the user's role in the context
    // and refresh the menu permissions
  }

  return (
    <div className="px-3 py-4 border-t border-border">
      <div className="mb-2 px-4 text-sm font-medium text-muted-foreground">Current Role</div>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
            isOpen && "bg-muted/50",
          )}
        >
          <span className="flex items-center">
            {currentRole.icon}
            <span className="ml-2">{currentRole.name}</span>
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 rounded-md border border-border bg-background shadow-lg z-10">
            <div className="py-1">
              {availableRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role)}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm hover:bg-muted",
                    currentRole.id === role.id && "bg-muted font-medium",
                  )}
                >
                  {role.icon}
                  <span className="ml-2">{role.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 px-4 text-xs text-muted-foreground">{currentRole.description}</div>
    </div>
  )
}
