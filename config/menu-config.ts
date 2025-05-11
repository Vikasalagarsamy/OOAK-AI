import type { MenuItem, MenuSection } from "@/types/menu-item"

// Main navigation menu configuration
export const mainNavItems: MenuItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/dashboard",
    icon: "layout-dashboard",
  },
  {
    id: "organization",
    name: "Organization",
    path: "/organization",
    icon: "building",
    children: [
      {
        id: "companies",
        name: "Companies",
        path: "/organization/companies",
        icon: "building-2",
      },
      {
        id: "branches",
        name: "Branches",
        path: "/organization/branches",
        icon: "git-branch",
      },
      {
        id: "clients",
        name: "Clients",
        path: "/organization/clients",
        icon: "users",
      },
      {
        id: "vendors",
        name: "Vendors",
        path: "/organization/vendors",
        icon: "truck",
      },
      {
        id: "suppliers",
        name: "Suppliers",
        path: "/organization/suppliers",
        icon: "package",
      },
      {
        id: "roles",
        name: "User Roles",
        path: "/organization/roles",
        icon: "shield",
        adminOnly: true,
      },
      {
        id: "account-creation",
        name: "Account Creation",
        path: "/organization/account-creation",
        icon: "user-plus",
        adminOnly: true,
      },
      {
        id: "user-accounts",
        name: "User Accounts",
        path: "/organization/user-accounts",
        icon: "users",
        adminOnly: true,
      },
    ],
  },
  {
    id: "people",
    name: "People",
    path: "/people",
    icon: "users",
    children: [
      {
        id: "employees",
        name: "Employees",
        path: "/people/employees",
        icon: "user",
      },
      {
        id: "departments",
        name: "Departments",
        path: "/people/departments",
        icon: "layout-grid",
      },
      {
        id: "designations",
        name: "Designations",
        path: "/people/designations",
        icon: "briefcase",
      },
      {
        id: "dashboard",
        name: "People Dashboard",
        path: "/people/dashboard",
        icon: "layout-dashboard",
      },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    path: "/sales",
    icon: "trending-up",
    requiredRoles: ["Administrator", "Sales Head", "Sales Executive"],
    children: [
      {
        id: "create-lead",
        name: "Create Lead",
        path: "/sales/create-lead",
        icon: "plus-circle",
      },
      {
        id: "manage-lead",
        name: "Manage Lead",
        path: "/sales/manage-lead",
        icon: "list-checks",
      },
      {
        id: "my-leads",
        name: "My Leads",
        path: "/sales/my-leads",
        icon: "clipboard-list",
      },
      {
        id: "unassigned-lead",
        name: "Unassigned Lead",
        path: "/sales/unassigned-lead",
        icon: "help-circle",
        requiredRoles: ["Administrator", "Sales Head"],
      },
      {
        id: "follow-up",
        name: "Follow Up",
        path: "/sales/follow-up",
        icon: "phone",
      },
      {
        id: "quotation",
        name: "Quotation",
        path: "/sales/quotation",
        icon: "file-text",
      },
      {
        id: "order-confirmation",
        name: "Order Confirmation",
        path: "/sales/order-confirmation",
        icon: "check-circle",
      },
      {
        id: "rejected-leads",
        name: "Rejected Leads",
        path: "/sales/rejected-leads",
        icon: "x-circle",
      },
      {
        id: "lead-sources",
        name: "Lead Sources",
        path: "/sales/lead-sources",
        icon: "filter",
        requiredRoles: ["Administrator", "Sales Head"],
      },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    path: "/reports",
    icon: "bar-chart",
    requiredRoles: ["Administrator", "Sales Head"],
    children: [
      {
        id: "lead-source-analysis",
        name: "Lead Source Analysis",
        path: "/reports/lead-sources",
        icon: "pie-chart",
      },
      {
        id: "conversion-funnel",
        name: "Conversion Funnel",
        path: "/reports/conversion-funnel",
        icon: "git-branch",
      },
      {
        id: "team-performance",
        name: "Team Performance",
        path: "/reports/team-performance",
        icon: "users",
      },
      {
        id: "trend-analysis",
        name: "Trend Analysis",
        path: "/reports/trends",
        icon: "trending-up",
      },
      {
        id: "custom-reports",
        name: "Custom Reports",
        path: "/reports/custom",
        icon: "settings",
        adminOnly: true,
      },
    ],
  },
  {
    id: "admin",
    name: "Administration",
    path: "/admin",
    icon: "shield",
    adminOnly: true,
    badge: {
      text: "Admin",
      variant: "destructive",
    },
    children: [
      {
        id: "menu-permissions",
        name: "Menu Permissions",
        path: "/admin/menu-permissions",
        icon: "list",
      },
      {
        id: "role-permissions",
        name: "Role Permissions",
        path: "/admin/role-permissions",
        icon: "shield",
      },
      {
        id: "test-permissions",
        name: "Test Permissions",
        path: "/admin/test-permissions",
        icon: "check-circle",
      },
      {
        id: "menu-diagnostics",
        name: "Menu Diagnostics",
        path: "/admin/menu-diagnostics",
        icon: "activity",
      },
      {
        id: "fix-database",
        name: "Database Repair",
        path: "/admin/fix-database",
        icon: "database",
      },
    ],
  },
]

// Dashboard quick access sections
export const dashboardSections: MenuSection[] = [
  {
    title: "Organization",
    items: [
      {
        id: "companies-quick",
        name: "Companies",
        path: "/organization/companies",
        icon: "building-2",
      },
      {
        id: "branches-quick",
        name: "Branches",
        path: "/organization/branches",
        icon: "git-branch",
      },
      {
        id: "clients-quick",
        name: "Clients",
        path: "/organization/clients",
        icon: "users",
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        id: "employees-quick",
        name: "Employees",
        path: "/people/employees",
        icon: "user",
      },
      {
        id: "departments-quick",
        name: "Departments",
        path: "/people/departments",
        icon: "layout-grid",
      },
    ],
  },
  {
    title: "Sales",
    items: [
      {
        id: "create-lead-quick",
        name: "Create Lead",
        path: "/sales/create-lead",
        icon: "plus-circle",
        requiredRoles: ["Administrator", "Sales Head", "Sales Executive"],
      },
      {
        id: "my-leads-quick",
        name: "My Leads",
        path: "/sales/my-leads",
        icon: "clipboard-list",
        requiredRoles: ["Administrator", "Sales Head", "Sales Executive"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        id: "user-roles-quick",
        name: "User Roles",
        path: "/organization/roles",
        icon: "shield",
        adminOnly: true,
      },
      {
        id: "account-creation-quick",
        name: "Account Creation",
        path: "/organization/account-creation",
        icon: "user-plus",
        adminOnly: true,
      },
    ],
  },
]
