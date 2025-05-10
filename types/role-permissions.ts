export interface Permission {
  id: string
  name: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[] // Array of permission IDs
  isAdmin?: boolean
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

// Default roles with their permissions
export const DEFAULT_ROLES: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access",
    permissions: ["admin.all"],
    isAdmin: true,
  },
  {
    id: "manager",
    name: "Manager",
    description: "Department and team management",
    permissions: [
      "dashboard",
      "audit",
      "people.*",
      "organization.companies",
      "organization.branches",
      "organization.clients",
      "sales.*",
      "reports.*",
    ],
  },
  {
    id: "employee",
    name: "Employee",
    description: "Basic employee access",
    permissions: ["dashboard", "people.employees"],
  },
  {
    id: "sales",
    name: "Sales Representative",
    description: "Sales team member",
    permissions: ["dashboard", "sales.*", "organization.clients"],
  },
  {
    id: "hr",
    name: "HR Personnel",
    description: "Human resources staff",
    permissions: ["dashboard", "audit", "people.*", "organization.roles"],
  },
]

// Helper function to check if a user has a specific permission
export function hasPermission(role: Role, permissionId: string): boolean {
  // Admin has all permissions
  if (role.isAdmin || role.permissions.includes("admin.all")) {
    return true
  }

  // Direct permission match
  if (role.permissions.includes(permissionId)) {
    return true
  }

  // Wildcard permission match (e.g., "people.*" grants access to "people.employees")
  const permissionParts = permissionId.split(".")
  if (permissionParts.length > 1) {
    const wildcardPermission = `${permissionParts[0]}.*`
    return role.permissions.includes(wildcardPermission)
  }

  return false
}
