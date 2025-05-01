"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function PeopleSubmenu() {
  const pathname = usePathname()

  const items = [
    {
      title: "Dashboard",
      href: "/people/dashboard",
      active: pathname === "/people/dashboard",
    },
    {
      title: "Employees",
      href: "/people/employees",
      active: pathname.startsWith("/people/employees"),
    },
    {
      title: "Departments",
      href: "/people/departments",
      active: pathname === "/people/departments",
    },
    {
      title: "Designations",
      href: "/people/designations",
      active: pathname === "/people/designations",
    },
  ]

  return (
    <nav className="flex space-x-2 lg:space-x-6 overflow-auto pb-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
            item.active ? "text-primary border-b-2 border-primary" : "text-muted-foreground",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
