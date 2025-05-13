"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  DollarSign,
  UserPlus,
  ClipboardList,
  PhoneCall,
  FileText,
  CheckSquare,
  XSquare,
  GitBranch,
  ListChecks,
} from "lucide-react"

const menuItems = [
  {
    title: "Dashboard",
    href: "/sales",
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: "Create Lead",
    href: "/sales/create-lead",
    icon: <UserPlus className="h-4 w-4" />,
  },
  {
    title: "My Leads",
    href: "/sales/my-leads",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    title: "Manage Leads",
    href: "/sales/manage-lead",
    icon: <ListChecks className="h-4 w-4" />,
  },
  {
    title: "Unassigned Leads",
    href: "/sales/unassigned-lead",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    title: "Lead Sources",
    href: "/sales/lead-sources",
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    title: "Follow Up",
    href: "/sales/follow-up",
    icon: <PhoneCall className="h-4 w-4" />,
  },
  {
    title: "Quotation",
    href: "/sales/quotation",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Order Confirmation",
    href: "/sales/order-confirmation",
    icon: <CheckSquare className="h-4 w-4" />,
  },
  {
    title: "Rejected Leads",
    href: "/sales/rejected-leads",
    icon: <XSquare className="h-4 w-4" />,
  },
]

export function SalesSubmenu() {
  const pathname = usePathname()

  return (
    <div className="bg-muted/40 p-4 rounded-lg mb-6">
      <div className="flex flex-wrap gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
              pathname === item.href && "bg-muted font-medium",
            )}
          >
            {item.icon}
            <span className="ml-2">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
