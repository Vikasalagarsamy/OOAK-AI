import { jwtVerify } from "jose" // Using jose instead of jsonwebtoken
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client for permission operations
export function createPermissionClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  return createClient(supabaseUrl, supabaseKey)
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
    const supabase = createPermissionClient()
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
export async function hasPermission(userId: string, menuPath: string, action = "view") {
  try {
    console.log(`Checking permission for user ${userId}, menu ${menuPath}, action ${action}`)

    const supabase = createPermissionClient()

    // Use our new database function to check permissions
    const { data, error } = await supabase.rpc("check_user_menu_permission", {
      p_user_id: userId,
      p_menu_path: menuPath,
      p_permission: action,
    })

    if (error) {
      console.error("Permission check error:", error)
      return false
    }

    console.log(`Permission check result: ${data}`)
    return data
  } catch (error) {
    console.error("Permission check error:", error)
    return false
  }
}

// Get current user from session
export async function getCurrentUser() {
  try {
    // In a non-server environment, we need to get the token from localStorage or cookies
    // This is a simplified version that would need to be adapted based on your auth flow
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

    if (!token) {
      console.log("No auth token found")
      return null
    }

    const { valid, payload } = await verifyAuth(token)

    if (!valid || !payload) {
      console.log("Invalid token or payload")
      return null
    }

    // Get user ID from token
    const userId = payload.sub

    // Get user details from database
    const supabase = createPermissionClient()
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
      .eq("id", userId)
      .single()

    if (error || !user || !user.is_active) {
      console.log("User not found or inactive")
      return null
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
    console.error("Session validation error:", error)
    return null
  }
}

// Check permissions for multiple paths
export async function checkPermissions(userId: string, permissionsToCheck: { path: string; action?: string }[]) {
  const results = {}
  await Promise.all(
    permissionsToCheck.map(async (perm) => {
      results[perm.path] = await hasPermission(userId, perm.path, perm.action || "view")
    }),
  )
  return results
}
