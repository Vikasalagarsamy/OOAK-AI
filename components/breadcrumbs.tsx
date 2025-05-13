"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumbs() {
  const pathname = usePathname()

  // Skip rendering breadcrumbs on the dashboard
  if (pathname === "/dashboard") {
    return null
  }

  // Split the pathname into segments
  const segments = pathname.split("/").filter(Boolean)

  // Map segments to more readable names
  const segmentNames: Record<string, string> = {
    organization: "Organization",
    companies: "Companies",
    branches: "Branches",
    clients: "Clients",
    suppliers: "Suppliers",
    vendors: "Vendors",
    roles: "Roles",
    "user-accounts": "User Accounts",
    "account-creation": "Account Creation",
    people: "People",
    employees: "Employees",
    departments: "Departments",
    designations: "Designations",
    dashboard: "Dashboard",
    sales: "Sales",
    "create-lead": "Create Lead",
    "my-leads": "My Leads",
    "unassigned-lead": "Unassigned Leads",
    "lead-sources": "Lead Sources",
    "follow-up": "Follow Up",
    quotation: "Quotation",
    "order-confirmation": "Order Confirmation",
    "rejected-leads": "Rejected Leads",
    reports: "Reports",
    "conversion-funnel": "Conversion Funnel",
    "team-performance": "Team Performance",
    trends: "Trend Analysis",
    custom: "Custom Reports",
    events: "Event Coordination",
    calendar: "Event Calendar",
    types: "Event Types",
    venues: "Venues",
    "staff-assignment": "Staff Assignment",
    audit: "Audit Logs",
    employee: "Employee Audit",
    admin: "Administration",
    "menu-permissions": "Menu & Role Permissions",
    settings: "System Settings",
    "menu-repair": "Menu Repair",
    "menu-debug": "Menu Debug",
    "test-permissions": "Test Permissions",
    "test-rbac": "Test RBAC",
    "fix-menu": "Fix Menu",
    "menu-sync": "Menu Sync",
    "unified-permissions": "Unified Permissions",
    "database-verification": "Database Verification",
    "fix-database": "Fix Database",
    "menu-reset": "Menu Reset",
    "menu-diagnostics": "Menu Diagnostics",
    "check-schema": "Check Schema",
    lead: "Lead Details",
  }

  return (
    <div className="flex items-center text-sm text-muted-foreground mb-4">
      <Link href="/dashboard" className="flex items-center hover:text-foreground">
        <Home className="h-4 w-4" />
        <span className="sr-only">Dashboard</span>
      </Link>

      {segments.map((segment, index) => {
        // Build the href for this segment
        const href = `/${segments.slice(0, index + 1).join("/")}`
        const isLast = index === segments.length - 1

        // Handle numeric IDs in the path (like lead/123 or employee/456)
        const isNumeric = !isNaN(Number(segment))
        let displayName = segmentNames[segment] || segment

        if (isNumeric) {
          if (index > 0) {
            if (segments[index - 1] === "lead") {
              displayName = "Lead #" + segment
            } else if (segments[index - 1] === "employee") {
              displayName = "Employee #" + segment
            }
          }
        }

        return (
          <div key={segment} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">{displayName}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {displayName}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
