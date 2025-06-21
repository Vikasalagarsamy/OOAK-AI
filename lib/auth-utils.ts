import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { query, transaction } from "@/lib/postgresql-client"

// Helper to verify auth token
export async function verifyAuth(token?: string) {
  try {
    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get("auth_token")?.value
    }
    
    if (!token) {
      return { success: false, error: "No authentication token found", user: null }
    }

    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    try {
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ["HS256"],
      })

      // Verify that the user still exists and is active using PostgreSQL
      const result = await query(
        "SELECT id, name, email, is_active FROM employees WHERE id = $1",
        [payload.sub]
      )

      if (result.rows.length === 0) {
        console.error("❌ [AUTH] User not found during verification:", payload.sub)
        return { success: false, error: "User not found", user: null }
      }

      const user = result.rows[0]

      if (!user.is_active) {
        console.error("❌ [AUTH] User is inactive:", payload.sub)
        return { success: false, error: "User is inactive", user: null }
      }

      console.log("✅ [AUTH] Token verification successful for user:", payload.sub)
      return { 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          ...payload
        },
        error: null
      }
    } catch (error) {
      console.error("❌ [AUTH] JWT verification error:", error)

      // If token is expired but not by more than 10 minutes, still consider it valid
      // This gives frontend time to refresh the token
      if (error instanceof Error && error.name === "JWTExpired") {
        const tokenData = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
        const expTime = tokenData.exp * 1000
        const gracePeriod = 10 * 60 * 1000 // 10 minutes

        if (Date.now() - expTime < gracePeriod) {
          console.log("⚠️ [AUTH] Token expired but within grace period")
          return { 
            success: true, 
            user: { id: tokenData.sub, ...tokenData }, 
            error: null,
            expired: true 
          }
        }
      }

      return { success: false, error: "Invalid or expired token", user: null }
    }
  } catch (error) {
    console.error("❌ [AUTH] Token verification error:", error)
    return { success: false, error: "Token verification failed", user: null }
  }
}

// Create a session token
export async function createSessionToken(user: any) {
  const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
  const secretKey = new TextEncoder().encode(secret)

  return await new SignJWT({
    sub: user.id.toString(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    employeeId: user.employeeId,
    role: user.roleId,
    roleName: user.roleName,
    isAdmin: user.isAdmin,
    iat: Math.floor(Date.now() / 1000),
    jti: `${user.id}-${Date.now()}`,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey)
}

// Check user's permission for a specific resource and action
export async function checkPermission(resourceName: string, actionType: string) {
  try {
    console.log(`🔐 [AUTH] Checking permission: ${resourceName}:${actionType}`)

    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      console.log("❌ [AUTH] No auth token found")
      return false
    }

    const authResult = await verifyAuth(token)

    if (!authResult.success || !authResult.user) {
      console.log("❌ [AUTH] Invalid token or payload")
      return false
    }

    const payload = authResult.user

    // Administrator role has all permissions
    if (payload.roleName === "Administrator") {
      console.log("✅ [AUTH] User is Administrator, granting permission automatically")
      return true
    }

    // For other roles, check specific permissions using PostgreSQL
    const result = await query(`
      SELECT 
        p.resource,
        p.action
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1 
      AND rp.status = 'ACTIVE'
      AND p.resource = $2 
      AND p.action = $3
    `, [payload.role, resourceName, actionType])

    const hasPermission = result.rows.length > 0
    
    console.log(`${hasPermission ? '✅' : '❌'} [AUTH] Permission check for ${resourceName}:${actionType} - Result: ${hasPermission}`)
    return hasPermission
  } catch (error) {
    console.error("❌ [AUTH] Permission check error:", error)
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
      console.log("🔒 [AUTH] Protected action called")

      // First check authentication
      const cookieStore = await cookies()
      const token = cookieStore.get("auth_token")?.value

      if (!token) {
        console.log("❌ [AUTH] Authentication required")
        return { error: "Authentication required" }
      }

      const authResult = await verifyAuth(token)

      if (!authResult.success || !authResult.user) {
        console.log("❌ [AUTH] Invalid or expired session")
        return { error: "Invalid or expired session" }
      }

      // Then check permission if required
      if (requiredPermission) {
        const hasPermission = await checkPermission(requiredPermission.resource, requiredPermission.action)

        if (!hasPermission) {
          console.log("❌ [AUTH] Insufficient permissions")
          return { error: "Insufficient permissions" }
        }
      }

      console.log("✅ [AUTH] Protected action authorized, proceeding...")
      // If all checks pass, execute the action
      return await action(...args)
    } catch (error) {
      console.error("❌ [AUTH] Protected action error:", error)
      return { error: "Internal server error" }
    }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return null
    }

    const authResult = await verifyAuth(token)

    if (!authResult.success || !authResult.user) {
      return null
    }

    const payload = authResult.user

    // Fetch complete user data using PostgreSQL
    const result = await query(`
      SELECT 
        e.*,
        r.title as role_name
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      WHERE e.id = $1 AND e.is_active = true
    `, [payload.sub])

    if (result.rows.length === 0) {
      console.log("❌ [AUTH] User not found or inactive")
      return null
    }

    const user = result.rows[0]

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      employeeId: user.id,
      roleId: user.role_id,
      roleName: user.role_name,
      isAdmin: user.role_name === "Administrator" || user.role_id === 1,
    }
  } catch (error) {
    console.error("❌ [AUTH] Error getting current user:", error)
    return null
  }
}

// Check if a user is authenticated (simplified version)
export async function isAuthenticated() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return false
    }

    const authResult = await verifyAuth(token)
    return authResult.success
  } catch (error) {
    console.error("❌ [AUTH] Authentication check error:", error)
    return false
  }
}
