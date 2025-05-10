export interface MenuItem {
  path: string
  icon: string
  subMenus: SubMenuItem[]
}

export interface SubMenuItem {
  name: string
  path: string
  icon: string
}

export const menuStructure: Record<string, MenuItem> = {
  Dashboard: {
    path: "/dashboard",
    icon: "layout-dashboard",
    subMenus: [],
  },
  Organization: {
    path: "/organization",
    icon: "building-2",
    subMenus: [
      {
        name: "Companies",
        path: "/organization/companies",
        icon: "building",
      },
      {
        name: "Branches",
        path: "/organization/branches",
        icon: "git-branch",
      },
      {
        name: "Vendors",
        path: "/organization/vendors",
        icon: "truck",
      },
      {
        name: "Suppliers",
        path: "/organization/suppliers",
        icon: "package",
      },
      {
        name: "Clients",
        path: "/organization/clients",
        icon: "users",
      },
      {
        name: "Roles",
        path: "/organization/roles",
        icon: "shield",
      },
      {
        name: "User Accounts",
        path: "/organization/user-accounts",
        icon: "user-cog",
      },
      {
        name: "Account Creation",
        path: "/organization/account-creation",
        icon: "user-plus",
      },
    ],
  },
  People: {
    path: "/people",
    icon: "users",
    subMenus: [
      {
        name: "Dashboard",
        path: "/people/dashboard",
        icon: "layout-dashboard",
      },
      {
        name: "Employees",
        path: "/people/employees",
        icon: "users",
      },
      {
        name: "Departments",
        path: "/people/departments",
        icon: "building",
      },
      {
        name: "Designations",
        path: "/people/designations",
        icon: "briefcase",
      },
    ],
  },
  Sales: {
    path: "/sales",
    icon: "trending-up",
    subMenus: [
      {
        name: "My Leads",
        path: "/sales/my-leads",
        icon: "briefcase",
      },
      {
        name: "Create Lead",
        path: "/sales/create-lead",
        icon: "user-plus",
      },
      {
        name: "Manage Lead",
        path: "/sales/manage-lead",
        icon: "settings",
      },
      {
        name: "Unassigned Lead",
        path: "/sales/unassigned-lead",
        icon: "briefcase",
      },
      {
        name: "Lead Sources",
        path: "/sales/lead-sources",
        icon: "truck",
      },
      {
        name: "Follow Up",
        path: "/sales/follow-up",
        icon: "calendar",
      },
      {
        name: "Quotation",
        path: "/sales/quotation",
        icon: "file-text",
      },
      {
        name: "Order Confirmation",
        path: "/sales/order-confirmation",
        icon: "check-circle",
      },
      {
        name: "Rejected Leads",
        path: "/sales/rejected-leads",
        icon: "x-circle",
      },
    ],
  },
  Reports: {
    path: "/reports",
    icon: "bar-chart-2",
    subMenus: [
      {
        name: "Lead Sources",
        path: "/reports/lead-sources",
        icon: "pie-chart",
      },
      {
        name: "Sales Performance",
        path: "/reports/sales-performance",
        icon: "trending-up",
      },
      {
        name: "Employee Performance",
        path: "/reports/employee-performance",
        icon: "users",
      },
    ],
  },
  Admin: {
    path: "/admin",
    icon: "settings",
    subMenus: [
      {
        name: "Menu Permissions",
        path: "/admin/menu-permissions",
        icon: "lock",
      },
      {
        name: "Menu Diagnostics",
        path: "/admin/menu-diagnostics",
        icon: "tool",
      },
      {
        name: "Menu Repair",
        path: "/admin/menu-repair",
        icon: "tool",
      },
      {
        name: "Fix Admin Permissions",
        path: "/admin/fix-admin-permissions",
        icon: "shield",
      },
      {
        name: "Test Permissions",
        path: "/admin/test-permissions",
        icon: "check-square",
      },
      {
        name: "Add Event Menu",
        path: "/admin/add-event-menu",
        icon: "plus-circle",
      },
      {
        name: "Setup Menu Permissions",
        path: "/admin/setup-menu-permissions",
        icon: "settings",
      },
      {
        name: "Role Permissions",
        path: "/admin/role-permissions",
        icon: "shield",
      },
      {
        name: "Fix Users By Role",
        path: "/admin/fix-users-by-role",
        icon: "users",
      },
      {
        name: "Check Schema",
        path: "/admin/check-schema",
        icon: "database",
      },
      {
        name: "Ensure Tables",
        path: "/admin/ensure-tables",
        icon: "database",
      },
      {
        name: "Update Constraints",
        path: "/admin/update-constraints",
        icon: "link",
      },
      {
        name: "Update Employee Companies Table",
        path: "/admin/update-employee-companies-table",
        icon: "edit",
      },
    ],
  },
  "Event Coordination": {
    path: "/event-coordination",
    icon: "calendar",
    subMenus: [
      {
        name: "Events Dashboard",
        path: "/event-coordination/dashboard",
        icon: "layout-dashboard",
      },
      {
        name: "Event Calendar",
        path: "/event-coordination/calendar",
        icon: "calendar",
      },
      {
        name: "Event Types",
        path: "/event-coordination/event-types",
        icon: "list",
      },
      {
        name: "Venues",
        path: "/event-coordination/venues",
        icon: "map-pin",
      },
      {
        name: "Staff Assignment",
        path: "/event-coordination/staff-assignment",
        icon: "users",
      },
    ],
  },
  Audit: {
    path: "/audit",
    icon: "clipboard-list",
    subMenus: [
      {
        name: "Activity Logs",
        path: "/audit/activity-logs",
        icon: "list",
      },
      {
        name: "Employee Audit",
        path: "/audit/employee",
        icon: "user-check",
      },
    ],
  },
}
