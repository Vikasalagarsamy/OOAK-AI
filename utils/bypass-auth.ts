// Utility functions to bypass authentication and authorization

// Mock user data
export const mockUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "admin@example.com",
  role: "admin",
  name: "Admin User",
  avatar_url: "/abstract-geometric-shapes.png",
}

// Mock role with all permissions
export const mockRole = {
  id: "admin-role",
  name: "Administrator",
  description: "Full access to all features",
  permissions: {
    // Grant all permissions
    "people.view": { view: true, read: true, write: true, delete: true },
    "people.departments": { view: true, read: true, write: true, delete: true },
    "people.designations": { view: true, read: true, write: true, delete: true },
    "people.employees": { view: true, read: true, write: true, delete: true },
    "organization.companies": { view: true, read: true, write: true, delete: true },
    "organization.branches": { view: true, read: true, write: true, delete: true },
    "organization.roles": { view: true, read: true, write: true, delete: true },
    "organization.vendors": { view: true, read: true, write: true, delete: true },
    "organization.suppliers": { view: true, read: true, write: true, delete: true },
    "organization.clients": { view: true, read: true, write: true, delete: true },
    sales: { view: true, read: true, write: true, delete: true },
    "sales.leads": { view: true, read: true, write: true, delete: true },
    "sales.quotations": { view: true, read: true, write: true, delete: true },
    "sales.orders": { view: true, read: true, write: true, delete: true },
    audit: { view: true, read: true, write: true, delete: true },
  },
}

// Function to check if a user has a permission - always returns true
export function hasPermission(permissionPath: string, action = "view") {
  return true
}

// Function to get the current user - always returns the mock user
export function getCurrentUser() {
  return mockUser
}

// Function to get user role - always returns the mock role
export function getUserRole() {
  return mockRole
}
