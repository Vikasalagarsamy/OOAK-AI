"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { PieChart, GitBranch, Users, TrendingUp, Settings } from "lucide-react"

interface ReportsSubMenuItem {
  href: string
  label: string
  icon: React.ReactNode
}

const reportMenuItems: ReportsSubMenuItem[] = [
  {
    href: "/reports/lead-sources",
    label: "Lead Source Analysis",
    icon: <PieChart className="h-4 w-4" />,
  },
  {
    href: "/reports/conversion-funnel",
    label: "Conversion Funnel",
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    href: "/reports/team-performance",
    label: "Team Performance",
    icon: <Users className="h-4 w-4" />,
  },
  {
    href: "/reports/trends",
    label: "Trend Analysis",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    href: "/reports/custom",
    label: "Custom Reports",
    icon: <Settings className="h-4 w-4" />,
  },
]

export function ReportsSubmenu() {
  const pathname = usePathname()

  return (
    <div className="mb-6">
      <nav className="flex overflow-x-auto pb-2 space-x-2">
        {reportMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap",
              pathname === item.href ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80",
            )}
          >
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
