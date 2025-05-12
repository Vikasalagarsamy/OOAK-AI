export interface Permission {
  id: string
  name: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  isAdmin?: boolean
  permissions?: string[]
}

// Default permissions
export const DEFAULT_PERMISSIONS: Permission[] = [
  {
    id: "admin.all",
    name: "Full Admin Access",
    description: "Complete access to all system features",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Access to the main dashboard",
  },
  {
    id: "audit",
    name: "Audit",
    description: "Access to audit logs and reports",
  },
  {
    id: "people.*",
    name: "People Management",
    description: "Access to all people management features",
  },
  {
    id: "people.employees",
    name: "Employee Management",
    description: "Access to employee management",
  },
  {
    id: "people.departments",
    name: "Department Management",
    description: "Access to department management",
  },
  {
    id: "people.designations",
    name: "Designation Management",
    description: "Access to designation management",
  },
  {
    id: "organization.*",
    name: "Organization Management",
    description: "Access to all organization features",
  },
  {
    id: "organization.companies",
    name: "Company Management",
    description: "Access to company management",
  },
  {
    id: "organization.branches",
    name: "Branch Management",
    description: "Access to branch management",
  },
  {
    id: "organization.roles",
    name: "Role Management",
    description: "Access to role management",
  },
  {
    id: "organization.vendors",
    name: "Vendor Management",
    description: "Access to vendor management",
  },
  {
    id: "organization.suppliers",
    name: "Supplier Management",
    description: "Access to supplier management",
  },
  {
    id: "organization.clients",
    name: "Client Management",
    description: "Access to client management",
  },
  {
    id: "sales.*",
    name: "Sales Management",
    description: "Access to all sales features",
  },
  {
    id: "reports.*",
    name: "Reports",
    description: "Access to all reports",
  },
  {
    id: "admin.*",
    name: "Admin Features",
    description: "Access to all admin features",
  },
  {
    id: "events.*",
    name: "Event Coordination",
    description: "Access to all event coordination features",
  },
]

// Default roles for testing
export const DEFAULT_ROLES: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access",
    isAdmin: true,
    permissions: ["*"],
  },
  {
    id: "manager",
    name: "Manager",
    description: "Department management",
    permissions: [
      "view_dashboard",
      "manage_employees",
      "view_reports",
      "manage_departments",
      "view_clients",
      "manage_leads",
    ],
  },
  {
    id: "employee",
    name: "Employee",
    description: "Basic access",
    permissions: ["view_dashboard", "view_profile", "view_tasks"],
  },
  {
    id: "sales",
    name: "Sales Rep",
    description: "Sales access",
    permissions: ["view_dashboard", "view_clients", "manage_leads", "view_reports"],
  },
  {
    id: "hr",
    name: "HR Staff",
    description: "HR department access",
    permissions: ["view_dashboard", "manage_employees", "view_departments"],
  },
]

// Helper function to check if a user has a specific permission
export function hasPermission(role: Role, permissionId: string): boolean {
  // Admin has all permissions
  if (role.isAdmin || role.permissions?.includes("*")) {
    return true
  }

  // Direct permission match
  if (role.permissions?.includes(permissionId)) {
    return true
  }

  // Wildcard permission match (e.g., "people.*" grants access to "people.employees")
  const permissionParts = permissionId.split(".")
  if (permissionParts.length > 1) {
    const wildcardPermission = `${permissionParts[0]}.*`
    return role.permissions?.includes(wildcardPermission)
  }

  return false
}
