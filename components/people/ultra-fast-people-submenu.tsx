/**
 * ⚡ ULTRA-FAST PEOPLE SUBMENU
 * 
 * Performance Features:
 * - Zero loading states
 * - Instant permission checks
 * - Optimistic rendering
 * - No async operations in render
 */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, Building2, Briefcase } from "lucide-react"
import { usePermissions } from "@/components/ultra-fast-auth-provider"

export function UltraFastPeopleSubmenu() {
  const pathname = usePathname()
  
  // 🔥 INSTANT PERMISSION CHECKS (NO LOADING)
  const permissions = usePermissions([
    { resource: 'people.employees' },
    { resource: 'people.departments' },
    { resource: 'people.designations' }
  ])

  const menuItems = [
    {
      title: "Employees",
      icon: Users,
      path: "/people/employees",
      permissionKey: "people.employees.view",
      enabled: permissions["people.employees.view"]
    },
    {
      title: "Departments",
      icon: Building2,
      path: "/people/departments",
      permissionKey: "people.departments.view",
      enabled: permissions["people.departments.view"]
    },
    {
      title: "Designations",
      icon: Briefcase,
      path: "/people/designations",
      permissionKey: "people.designations.view",
      enabled: permissions["people.designations.view"]
    }
  ]

  return (
    <nav className="flex space-x-1 border-b border-gray-200">
      {menuItems.map((item) => {
        if (!item.enabled) return null

        const Icon = item.icon
        const isActive = pathname === item.path

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200",
              isActive
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Icon size={16} />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
} 