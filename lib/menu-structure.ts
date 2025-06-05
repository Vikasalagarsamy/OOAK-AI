import type { MenuItem } from "@/types/menu"

// Define the menu structure
export const menuStructure: Record<string, MenuItem> = {
  dashboard: {
    label: "Dashboard",
    icon: "layout-dashboard",
    href: "/dashboard",
  },
  organization: {
    label: "Organization",
    icon: "building",
    submenu: {
      companies: {
        label: "Companies",
        href: "/organization/companies",
      },
      branches: {
        label: "Branches",
        href: "/organization/branches",
      },
      clients: {
        label: "Clients",
        href: "/organization/clients",
      },
      suppliers: {
        label: "Suppliers",
        href: "/organization/suppliers",
      },
      vendors: {
        label: "Vendors",
        href: "/organization/vendors",
      },
      roles: {
        label: "Roles",
        href: "/organization/roles",
      },
      "user-accounts": {
        label: "User Accounts",
        href: "/organization/user-accounts",
      },
      "account-creation": {
        label: "Account Creation",
        href: "/organization/account-creation",
      },
    },
  },
  people: {
    label: "People",
    icon: "users",
    submenu: {
      dashboard: {
        label: "Dashboard",
        href: "/people/dashboard",
      },
      employees: {
        label: "Employees",
        href: "/people/employees",
      },
      departments: {
        label: "Departments",
        href: "/people/departments",
      },
      designations: {
        label: "Designations",
        href: "/people/designations",
      },
    },
  },
  sales: {
    label: "Sales",
    icon: "line-chart",
    submenu: {
      dashboard: {
        label: "Dashboard",
        href: "/sales",
      },
      "create-lead": {
        label: "Create Lead",
        href: "/sales/create-lead",
      },
      "my-leads": {
        label: "My Leads",
        href: "/sales/my-leads",
      },
      "unassigned-lead": {
        label: "Unassigned Leads",
        href: "/sales/unassigned-lead",
      },
      "lead-sources": {
        label: "Lead Sources",
        href: "/sales/lead-sources",
      },
      "follow-up": {
        label: "Follow Up",
        href: "/sales/follow-up",
      },
      quotation: {
        label: "Quotations",
        href: "/sales/quotations",
      },
      "order-confirmation": {
        label: "Order Confirmation",
        href: "/sales/order-confirmation",
      },
      "rejected-leads": {
        label: "Rejected Leads",
        href: "/sales/rejected-leads",
      },
    },
  },
  reports: {
    label: "Reports",
    icon: "bar-chart",
    submenu: {
      "lead-sources": {
        label: "Lead Source Analysis",
        href: "/reports/lead-sources",
      },
      "conversion-funnel": {
        label: "Conversion Funnel",
        href: "/reports/conversion-funnel",
      },
      "team-performance": {
        label: "Team Performance",
        href: "/reports/team-performance",
      },
      "trend-analysis": {
        label: "Trend Analysis",
        href: "/reports/trend-analysis",
      },
      "custom-reports": {
        label: "Custom Reports",
        href: "/reports/custom-reports",
      },
    },
  },
  "event-coordination": {
    label: "Event Coordination",
    icon: "calendar",
    submenu: {
      dashboard: {
        label: "Events Dashboard",
        href: "/events/dashboard",
      },
      calendar: {
        label: "Event Calendar",
        href: "/events/calendar",
      },
      events: {
        label: "Events",
        href: "/events",
      },
      "event-types": {
        label: "Event Types",
        href: "/events/types",
      },
      venues: {
        label: "Venues",
        href: "/events/venues",
      },
      "staff-assignment": {
        label: "Staff Assignment",
        href: "/events/staff-assignment",
      },
    },
  },
  audit: {
    label: "Audit",
    icon: "clipboard-list",
    submenu: {
      "activity-logs": {
        label: "Activity Logs",
        href: "/audit",
      },
      "employee-audit": {
        label: "Employee Audit",
        href: "/audit/employee",
      },
    },
  },
  admin: {
    label: "Admin",
    icon: "settings",
    submenu: {
      "menu-permissions": {
        label: "Menu & Role Permissions",
        href: "/admin/menu-permissions-manager",
      },
      // All other Admin menu items have been removed as requested
    },
  },
}
