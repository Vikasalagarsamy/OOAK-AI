"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, FileSearch } from "lucide-react"
import { cn } from "@/lib/utils"

export function AuditSubmenu() {
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Activity Logs",
      href: "/audit",
      icon: <Activity className="h-4 w-4 mr-2" />,
    },
    {
      title: "Employee Audit",
      href: "/audit/employee",
      icon: <FileSearch className="h-4 w-4 mr-2" />,
    },
  ]

  return (
    <nav className="flex border-b mb-6 overflow-x-auto">
      {menuItems.map((item) => {
        const isActive = item.href === "/audit" ? pathname === "/audit" : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300",
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
