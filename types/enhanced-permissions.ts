import type { Permission } from "./role"

// Enhanced permission types for more granular control
export type PermissionType = "view" | "read" | "write" | "delete" | "admin"

// Define permission sets for different user types
export type PermissionSet = {
  requiredPermissions: PermissionType[]
  requiredRoles?: string[]
  anyPermission?: boolean // If true, user needs ANY of the permissions, not ALL
}

// Helper function to check if a user has the required permissions
export function hasRequiredPermissions(
  userPermissions: Record<string, Permission>,
  requiredPermissionSet: PermissionSet,
  isAdmin: boolean,
  userRoleId: string,
): boolean {
  // Admin override - admins can access everything
  if (isAdmin) return true

  // Check role-specific permissions
  if (requiredPermissionSet.requiredRoles && !requiredPermissionSet.requiredRoles.includes(userRoleId)) {
    return false
  }

  // If no specific permissions are required, allow access
  if (!requiredPermissionSet.requiredPermissions || requiredPermissionSet.requiredPermissions.length === 0) {
    return true
  }

  // For "admin" permission, only admins can access (already checked above)
  if (requiredPermissionSet.requiredPermissions.includes("admin") && !isAdmin) {
    return false
  }

  // Check if user has ANY of the required permissions (when anyPermission is true)
  if (requiredPermissionSet.anyPermission) {
    return requiredPermissionSet.requiredPermissions.some((permission) => {
      if (permission === "admin") return isAdmin

      // Check if user has this permission for any module
      return Object.values(userPermissions).some(
        (modulePermission) =>
          (permission === "view" && modulePermission.view) ||
          (permission === "read" && modulePermission.read) ||
          (permission === "write" && modulePermission.write) ||
          (permission === "delete" && modulePermission.delete),
      )
    })
  }

  // Check if user has ALL of the required permissions
  return requiredPermissionSet.requiredPermissions.every((permission) => {
    if (permission === "admin") return isAdmin

    // Check if user has this permission for any module
    return Object.values(userPermissions).some(
      (modulePermission) =>
        (permission === "view" && modulePermission.view) ||
        (permission === "read" && modulePermission.read) ||
        (permission === "write" && modulePermission.write) ||
        (permission === "delete" && modulePermission.delete),
    )
  })
}
