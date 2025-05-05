"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose" // Using jose instead of jsonwebtoken

// Define types
type AuthResult = {
  success: boolean
  error?: string
  user?: any
}

// Authentication function
export async function authenticate(username: string, password: string): Promise<AuthResult> {
  try {
    const supabase = createClient()

    // Get user account from database
    const { data: userAccount, error: userError } = await supabase
      .from("user_accounts")
      .select(`
        id, 
        username, 
        email, 
        password_hash, 
        is_active, 
        employee_id, 
        role_id,
        employees:employee_id (
          id, 
          employee_id, 
          first_name, 
          last_name, 
          email
        ),
        roles:role_id (
          id, 
          title, 
          description
        )
      `)
      .eq("username", username)
      .single()

    if (userError || !userAccount) {
      console.error("User not found:", userError?.message || "No user with that username")
      // Log the attempt for security auditing
      await logAuthAttempt(username, false, "User not found")
      return { success: false, error: "Invalid username or password" }
    }

    // Check if account is active
    if (!userAccount.is_active) {
      await logAuthAttempt(username, false, "Account inactive")
      return { success: false, error: "This account has been deactivated. Please contact your administrator." }
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, userAccount.password_hash)
    if (!passwordValid) {
      await logAuthAttempt(username, false, "Invalid password")
      return { success: false, error: "Invalid username or password" }
    }

    // Create a user object without sensitive data
    const user = {
      id: userAccount.id,
      username: userAccount.username,
      email: userAccount.email,
      employeeId: userAccount.employee_id,
      roleId: userAccount.role_id,
      firstName: userAccount.employees?.first_name || "",
      lastName: userAccount.employees?.last_name || "",
      roleName: userAccount.roles?.title || "",
    }

    // Create session token
    const token = await createSessionToken(user)

    // Store in cookie
    const cookieStore = cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    // Update last login timestamp
    await supabase.from("user_accounts").update({ last_login: new Date().toISOString() }).eq("id", userAccount.id)

    // Log successful login
    await logAuthAttempt(username, true, "Authentication successful")

    return { success: true, user }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, error: "An error occurred during authentication" }
  }
}

// Create JWT token for session using jose library
async function createSessionToken(user: any) {
  const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
  const secretKey = new TextEncoder().encode(secret)

  return await new SignJWT({
    sub: user.id.toString(),
    username: user.username,
    role: user.roleId,
    roleName: user.roleName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey)
}

// Log authentication attempts for security auditing
async function logAuthAttempt(username: string, success: boolean, message: string) {
  try {
    const supabase = createClient()

    // First, check if the auth_logs table exists
    const { data: tableExists } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "auth_logs")
      .eq("table_schema", "public")

    // If table doesn't exist, create it
    if (!tableExists || tableExists.length === 0) {
      console.log("auth_logs table doesn't exist yet, skipping logging")
      return // Skip logging if table doesn't exist
    }

    // Insert the log entry
    const { error } = await supabase.from("auth_logs").insert({
      username,
      success,
      message,
      ip_address: "IP capture disabled in this implementation",
      user_agent: "User agent capture disabled in this implementation",
      timestamp: new Date().toISOString(),
    })

    if (error) {
      console.error("Error logging auth attempt:", error)
    }
  } catch (error) {
    console.error("Failed to log auth attempt:", error)
    // Non-critical, so we don't throw the error
  }
}

// Get current user from session
export async function getCurrentUser() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) return null

    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    })

    // Fetch fresh user data from database
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
        employees:employee_id (
          id, 
          employee_id, 
          first_name, 
          last_name
        ),
        roles:role_id (
          id, 
          title
        )
      `)
      .eq("id", payload.sub)
      .single()

    if (error || !user || !user.is_active) {
      // Invalid or inactive user
      logout()
      return null
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      employeeId: user.employee_id,
      roleId: user.role_id,
      firstName: user.employees?.first_name || "",
      lastName: user.employees?.last_name || "",
      roleName: user.roles?.title || "",
      isAdmin: user.roles?.title === "Administrator",
    }
  } catch (error) {
    console.error("Session validation error:", error)
    // Clear invalid session
    logout()
    return null
  }
}

// Logout functionality
export async function logout() {
  const cookieStore = cookies()
  cookieStore.delete("auth_token")
  redirect("/login")
}

// Check if user has required permission
export async function hasPermission(requiredRole: string) {
  const user = await getCurrentUser()
  if (!user) return false

  // Admin has all permissions
  if (user.roleName === "Administrator") return true

  // Check specific role match
  return user.roleName === requiredRole
}
