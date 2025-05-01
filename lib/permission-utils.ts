// This file has been modified to bypass permission checks

// Check if a user has a specific permission - always returns true
export async function hasPermission(userId: string, permissionPath: string, action = "view"): Promise<boolean> {
  // Always return true to bypass permission checks
  return true
}

// Get current user - returns a mock user
export async function getCurrentUser() {
  // Return a mock user
  return {
    id: "00000000-0000-0000-0000-000000000000",
    email: "admin@example.com",
    role: "admin",
  }
}

// Check multiple permissions at once - always returns true for all
export async function checkPermissions(
  userId: string,
  permissions: { path: string; action?: string }[],
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  // Set all permissions to true
  for (const { path } of permissions) {
    results[path] = true
  }

  return results
}
