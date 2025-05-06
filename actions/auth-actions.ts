"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

// Define types
type AuthResult = {
  success: boolean
  error?: string
  user?: any
}

// Authentication function
export async function authenticate(username: string, password: string): Promise<AuthResult> {
  try {
    console.log("Authentication started for user:", username)
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
      return { success: false, error: "Invalid username or password" }
    }

    console.log("User found, verifying password")

    // Check if account is active
    if (!userAccount.is_active) {
      console.log("Account is inactive")
      return { success: false, error: "This account has been deactivated. Please contact your administrator." }
    }

    // Verify password - ensure password_hash exists
    if (!userAccount.password_hash) {
      console.error("User has no password hash")
      return { success: false, error: "Account not properly configured. Contact administrator." }
    }

    try {
      const passwordValid = await bcrypt.compare(password, userAccount.password_hash)
      if (!passwordValid) {
        console.log("Password invalid")
        return { success: false, error: "Invalid username or password" }
      }
    } catch (passwordError) {
      console.error("Password verification error:", passwordError)
      return { success: false, error: "Error verifying credentials" }
    }

    console.log("Password verified, creating user object and token")

    // Create a user object without sensitive data
    const user = {
      id: userAccount.id,
      username: userAccount.username,
      email: userAccount.email || "",
      employeeId: userAccount.employee_id,
      roleId: userAccount.role_id,
      firstName: userAccount.employees?.first_name || "",
      lastName: userAccount.employees?.last_name || "",
      roleName: userAccount.roles?.title || "",
    }

    try {
      // Create session token
      const token = await createSessionToken(user)
      console.log("Token created")

      // Store in cookie
      const cookieStore = cookies()
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax",
      })
      console.log("Cookie set")

      // Update last login timestamp
      await supabase.from("user_accounts").update({ last_login: new Date().toISOString() }).eq("id", userAccount.id)
      console.log("Last login updated")

      return { success: true, user }
    } catch (tokenError) {
      console.error("Token creation error:", tokenError)
      return { success: false, error: "Error creating session" }
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, error: "An error occurred during authentication" }
  }
}

// Create JWT token for session using jose library
async function createSessionToken(user: any) {
  const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
  if (!secret) {
    console.error("JWT_SECRET is not defined!")
  }

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

// Get current user from session
export async function getCurrentUser() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      console.log("No auth token found in cookies")
      return null
    }

    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    try {
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ["HS256"],
      })

      console.log("Token verified, payload:", payload)

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

      if (error) {
        console.error("Error fetching user data:", error)
        return null
      }

      if (!user || !user.is_active) {
        console.log("User not found or inactive")
        return null
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email || "",
        employeeId: user.employee_id,
        roleId: user.role_id,
        firstName: user.employees?.first_name || "",
        lastName: user.employees?.last_name || "",
        roleName: user.roles?.title || "",
        isAdmin: user.roles?.title === "Administrator",
      }
    } catch (verifyError) {
      console.error("Token verification error:", verifyError)
      return null
    }
  } catch (error) {
    console.error("Session validation error:", error)
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
