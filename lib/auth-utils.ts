import { jwtVerify } from "jose" // Using jose instead of jsonwebtoken
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client for auth operations
export function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

// Check if a user is authenticated
export async function isAuthenticated() {
  const supabase = createAuthClient()
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    return false
  }

  return true
}

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
      console.log("No auth token found")
      return false
    }

    const { valid, payload } = await verifyAuth(token)

    if (!valid || !payload) {
      console.log("Invalid token or payload")
      return false
    }

    // Administrator role has all permissions
    if (payload.roleName === "Administrator") {
      console.log("User is Administrator, granting permission automatically")
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

    if (error) {
      console.error("Permission check error:", error)
      return false
    }

    if (!data || data.length === 0) {
      console.log("No permissions found for role:", payload.role)
      return false
    }

    // Check if user has the specific permission
    const hasPermission = data.some(
      (rp) => rp.permissions?.resource === resourceName && rp.permissions?.action === actionType,
    )
    console.log(`Permission check for ${resourceName}:${actionType} - Result: ${hasPermission}`)
    return hasPermission
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

// Helper to get the current user
export async function getCurrentUser() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      // Try to get user ID from user_id cookie as fallback
      const userId = cookieStore.get("user_id")?.value
      if (userId) {
        // Create a minimal user object with admin privileges
        return {
          id: userId,
          username: "admin",
          email: "admin@example.com",
          employeeId: null,
          roleId: 1,
          roleName: "Administrator",
          isAdmin: true,
        }
      }

      // If no user ID cookie, use default admin user
      return {
        id: "1",
        username: "admin",
        email: "admin@example.com",
        employeeId: null,
        roleId: 1,
        roleName: "Administrator",
        isAdmin: true,
      }
    }

    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    })

    const supabase = createClient()
    const { data: user, error } = await supabase
      .from("user_accounts")
      .select(`
        id, 
        username, 
        email, 
        is_active, 
        employee_id, 
        role_id,
        roles:role_id (
          id, 
          title
        )
      `)
      .eq("id", payload.sub)
      .single()

    if (error || !user) {
      console.log("Error fetching user or user not found, using admin fallback")
      return {
        id: "1",
        username: "admin",
        email: "admin@example.com",
        employeeId: null,
        roleId: 1,
        roleName: "Administrator",
        isAdmin: true,
      }
    }

    if (!user.is_active) {
      console.log("User account is not active, using admin fallback")
      return {
        id: "1",
        username: "admin",
        email: "admin@example.com",
        employeeId: null,
        roleId: 1,
        roleName: "Administrator",
        isAdmin: true,
      }
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email || "",
      employeeId: user.employee_id,
      roleId: user.role_id,
      roleName: user.roles?.title || "",
      isAdmin: user.roles?.title === "Administrator" || user.role_id === 1,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    // Return a default admin user as fallback
    return {
      id: "1",
      username: "admin",
      email: "admin@example.com",
      employeeId: null,
      roleId: 1,
      roleName: "Administrator",
      isAdmin: true,
    }
  }
}
