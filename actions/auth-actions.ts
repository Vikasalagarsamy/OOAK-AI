"use server"

import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { query, transaction } from "@/lib/postgresql-client"
import { SignJWT, jwtVerify } from "jose"
import { Database } from "@/types/database.types"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

// Define types for database responses
interface Role {
  id: number
  title: string
}

interface Employee {
  id: number
  username: string
  password_hash: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role_id: number
  is_active: boolean
  roles: Role
}

// Simple auth result type
interface AuthResult {
  success: boolean
  error?: string
  user?: any
  token?: string
}

// Authentication function
export async function authenticate(username: string, password: string): Promise<AuthResult> {
  try {
    console.log("🔐 [AUTH] Authentication started for user:", username)

    // Get user from employees table with role info using PostgreSQL
    const result = await query(`
      SELECT 
        e.id, 
        e.username,
        e.password_hash,
        e.email,
        e.first_name,
        e.last_name,
        e.role_id,
        e.is_active,
        json_build_object(
          'id', r.id,
          'title', r.title
        ) as roles
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      WHERE e.username = $1
    `, [username])

    if (result.rows.length === 0) {
      console.error("❌ [AUTH] User not found:", username)
      return { success: false, error: "Invalid username or password" }
    }

    const employee = result.rows[0]

    // Basic validation
    if (!employee.is_active) {
      console.error("❌ [AUTH] Account inactive for user:", username)
      return { success: false, error: "Account is inactive" }
    }

    if (!employee.password_hash) {
      console.error("❌ [AUTH] Account not properly configured for user:", username)
      return { success: false, error: "Account not properly configured" }
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, employee.password_hash)
    if (!passwordValid) {
      console.error("❌ [AUTH] Invalid password for user:", username)
      return { success: false, error: "Invalid username or password" }
    }

    // Create user object
    const user = {
      id: employee.id,
      username: employee.username,
      email: employee.email || "",
      firstName: employee.first_name || "",
      lastName: employee.last_name || "",
      roleId: employee.role_id,
      roleName: employee.roles?.title || "",
      isAdmin: employee.roles?.title === "Administrator" || employee.role_id === 1
    }

    // Create JWT token
    const token = await createToken(user)

    // Update last login using PostgreSQL
    await query(`
      UPDATE employees 
      SET last_login = $1, updated_at = $1
      WHERE id = $2
    `, [new Date().toISOString(), employee.id])

    console.log("✅ [AUTH] Authentication successful for user:", username)
    return { success: true, user, token }
  } catch (error) {
    console.error("❌ [AUTH] Authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

// Get current user from session
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    if (!token) return null

    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    })

    if (!payload.sub) return null

    return {
      id: payload.sub,
      username: payload.username as string,
      email: payload.email as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      roleId: payload.role as number,
      roleName: payload.roleName as string,
      isAdmin: payload.isAdmin as boolean,
    }
  } catch (error) {
    console.error("❌ [AUTH] Get current user error:", error)
    return null
  }
}

// Logout functionality
export async function logout() {
  try {
    // Clear the auth token cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth_token")

    console.log("✅ [AUTH] User logged out successfully")
    return { success: true }
  } catch (error) {
    console.error("❌ [AUTH] Logout error:", error)
    return { success: false, error: "Failed to log out" }
  }
}

// Check if user has required permission
export async function hasPermission(requiredRole: string) {
  const user = await getCurrentUser()
  if (!user) return false

  // Admin has all permissions
  if (user.roleName === "Administrator" || user.roleId === 1) return true

  // Check specific role match
  return user.roleName === requiredRole
}

// Add this function to refresh user session with fresh permissions
export async function refreshUserSession() {
  try {
    console.log("🔄 [AUTH] Refreshing user session...")

    // First, get the current user data
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      console.error("❌ [AUTH] No user found to refresh session")
      return { success: false, error: "No active session found" }
    }

    // Fetch fresh employee data with PostgreSQL
    const result = await query(`
      SELECT 
        e.*,
        json_build_object(
          'id', r.id,
          'title', r.title,
          'permissions', r.permissions
        ) as roles
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      WHERE e.id = $1
    `, [currentUser.id])

    if (result.rows.length === 0) {
      console.error("❌ [AUTH] Employee not found during session refresh")
      return { success: false, error: "Failed to fetch updated user data" }
    }

    const employee = result.rows[0]

    // Create updated user object
    const updatedUser = {
      id: employee.id,
      username: employee.username,
      email: employee.email || "",
      firstName: employee.first_name || "",
      lastName: employee.last_name || "",
      roleId: employee.role_id,
      roleName: employee.roles?.title || "",
      isAdmin: employee.roles?.title === "Administrator" || employee.role_id === 1
    }

    // Create new JWT token with updated data
    const newToken = await createToken(updatedUser)

    // Set the new token as a cookie
    const cookieStore = await cookies()
    cookieStore.set("auth_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    console.log("✅ [AUTH] User session refreshed successfully")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("❌ [AUTH] Error refreshing user session:", error)
    return { success: false, error: "Failed to refresh session" }
  }
}

async function createToken(user: any) {
  const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
  const secretKey = new TextEncoder().encode(secret)

  const token = await new SignJWT({
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.roleId,
    roleName: user.roleName,
    isAdmin: user.isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id.toString())
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey)

  return token
}