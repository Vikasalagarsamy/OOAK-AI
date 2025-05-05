import { jwtVerify } from "jose" // Using jose instead of jsonwebtoken
import { cookies } from "next/headers"
import { createClient } from "./supabase"

// Helper to verify auth token
export async function verifyAuth(token: string) {
  try {
    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    })

    // Verify that the user still exists and is active
    const supabase = createClient()
    const { data, error } = await supabase.from("user_accounts").select("is_active").eq("id", payload.sub).single()

    if (error || !data || !data.is_active) {
      return { valid: false, payload: null }
    }

    return { valid: true, payload }
  } catch (error) {
    console.error("Token verification error:", error)
    return { valid: false, payload: null }
  }
}

// Check user's permission for a specific resource and action
export async function checkPermission(resourceName: string, actionType: string) {
  try {
    const token = cookies().get("auth_token")?.value

    if (!token) {
      return false
    }

    const { valid, payload } = await verifyAuth(token)

    if (!valid || !payload) {
      return false
    }

    // Administrator role has all permissions
    if (payload.roleName === "Administrator") {
      return true
    }

    // For other roles, check specific permissions
    const supabase = createClient()
    const { data, error } = await supabase
      .from("role_permissions")
      .select(`
        permissions:permission_id (
          resource,
          action
        )
      `)
      .eq("role_id", payload.role)
      .eq("status", "ACTIVE")

    if (error || !data) {
      console.error("Permission check error:", error)
      return false
    }

    // Check if user has the specific permission
    return data.some((rp) => rp.permissions?.resource === resourceName && rp.permissions?.action === actionType)
  } catch (error) {
    console.error("Permission check error:", error)
    return false
  }
}

// Create a protected server action that requires authentication
export function createProtectedAction<T, A extends any[]>(
  action: (...args: A) => Promise<T>,
  requiredPermission?: { resource: string; action: string },
) {
  return async (...args: A): Promise<T | { error: string }> => {
    try {
      // First check authentication
      const token = cookies().get("auth_token")?.value

      if (!token) {
        return { error: "Authentication required" }
      }

      const { valid, payload } = await verifyAuth(token)

      if (!valid || !payload) {
        return { error: "Invalid or expired session" }
      }

      // Then check permission if required
      if (requiredPermission) {
        const hasPermission = await checkPermission(requiredPermission.resource, requiredPermission.action)

        if (!hasPermission) {
          return { error: "Insufficient permissions" }
        }
      }

      // If all checks pass, execute the action
      return await action(...args)
    } catch (error) {
      console.error("Protected action error:", error)
      return { error: "An error occurred while processing your request" }
    }
  }
}
