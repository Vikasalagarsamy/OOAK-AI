"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"

// Helper function to generate JWT
async function generateJwt(
  userId: string,
  username: string,
  roleId: number,
  roleName: string,
  isAdmin: boolean,
): Promise<string> {
  const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
  const secretKey = new TextEncoder().encode(secret)

  const token = await new SignJWT({
    sub: userId,
    username,
    roleId,
    roleName,
    isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // Increased for better user experience
    .sign(secretKey)

  return token
}

// Rate limiting helper
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second between requests

// Authentication function
export async function authenticate(username: string, password: string) {
  try {
    // Basic rate limiting for preview environments
    const now = Date.now()
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      console.log("Rate limiting in effect, delaying request")
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL))
    }
    lastRequestTime = Date.now()

    console.log("Authentication started for user:", username)
    const supabase = createClient()

    // Handle preview environment specially
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === "development" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
      // For preview environments, simulate successful login with admin access
      if (username === "admin" && password === "admin") {
        const mockUser = {
          id: "preview-admin-id",
          username: "admin",
          email: "admin@example.com",
          employeeId: "EMP001",
          roleId: 1,
          roleName: "Administrator",
          isAdmin: true,
        }

        // Create preview token
        const token = await generateJwt(
          mockUser.id,
          mockUser.username,
          mockUser.roleId,
          mockUser.roleName,
          mockUser.isAdmin,
        )

        // Set cookie
        const cookieStore = cookies()
        cookieStore.set("auth_token", token, {
          httpOnly: true,
          secure: false,
          maxAge: 60 * 60 * 24,
          path: "/",
          sameSite: "lax",
        })

        return { success: true, user: mockUser }
      }

      // For other credentials in preview, return error
      return { success: false, error: "Invalid credentials (in preview, use admin/admin)" }
    }

    // Handle rate limiting detection
    try {
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
          roles:role_id (
            id, 
            title
          )
        `)
        .eq("username", username)
        .single()

      // Check if we received a rate limit error
      if (userError) {
        const errorMessage = userError.message || ""

        // Check for rate limit indicators in the error message
        if (
          errorMessage.includes("Too Many Request") ||
          userError.code === "429" ||
          errorMessage.includes("rate limit")
        ) {
          console.error("Rate limit exceeded:", errorMessage)
          return {
            success: false,
            error: "Too many login attempts. Please wait a moment and try again.",
          }
        }

        console.error("User not found:", userError.message || "No user with that username")
        return { success: false, error: "Invalid username or password" }
      }

      if (!userAccount) {
        console.error("User account not found")
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
        roleName: userAccount.roles?.title || "",
        isAdmin: userAccount.roles?.title === "Administrator" || userAccount.role_id === 1,
      }

      try {
        // Create session token
        const token = await generateJwt(user.id, user.username, user.roleId as number, user.roleName, user.isAdmin)
        console.log("Token created successfully")

        // Store in cookie
        const cookieStore = cookies()

        // First clear any existing auth cookie to prevent conflicts
        cookieStore.delete("auth_token")

        // Set new cookie with proper attributes
        cookieStore.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24, // 24 hours
          path: "/",
          sameSite: "lax", // Changed from strict to lax for better redirect handling
        })
        console.log("Cookie set successfully")

        // Update last login timestamp
        await supabase.from("user_accounts").update({ last_login: new Date().toISOString() }).eq("id", userAccount.id)
        console.log("Last login updated")

        return { success: true, user }
      } catch (tokenError) {
        console.error("Token creation error:", tokenError)
        return { success: false, error: "Error creating session" }
      }
    } catch (supabaseError: any) {
      // Handle potential rate limiting or other Supabase errors
      console.error("Supabase error:", supabaseError)

      const errorMessage = supabaseError?.message || ""

      if (errorMessage.includes("Too Many Request") || errorMessage.includes("rate limit")) {
        return {
          success: false,
          error: "The server is busy. Please wait a moment before trying again.",
        }
      }

      return { success: false, error: "Authentication service unavailable. Please try again later." }
    }
  } catch (error: any) {
    console.error("Authentication error:", error)

    // Handle possible rate limiting errors from the error object
    if (
      error?.message?.includes("Too Many Request") ||
      error?.message?.includes("rate limit") ||
      error?.status === 429
    ) {
      return {
        success: false,
        error: "Too many login attempts. Please wait a moment and try again.",
      }
    }

    return { success: false, error: "An error occurred during authentication. Please try again." }
  }
}

// The rest of the file is unchanged
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

      if (!payload.sub) {
        console.error("Token payload missing subject (user ID)")
        return null
      }

      // Check if in preview mode and provide mock data
      if (process.env.NEXT_PUBLIC_VERCEL_ENV === "development" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
        if (payload.sub === "preview-admin-id") {
          return {
            id: "preview-admin-id",
            username: "admin",
            email: "admin@example.com",
            employeeId: "EMP001",
            roleId: 1,
            roleName: "Administrator",
            isAdmin: true,
          }
        }
      }

      // Verify user still exists and is active
      const supabase = createClient()

      try {
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

        if (error) {
          // Check for rate limiting in error message
          if (error.message?.includes("Too Many Request") || error.code === "429") {
            console.log("Rate limit hit when fetching user, using token data instead")
            // Use data from the token as fallback
            return {
              id: payload.sub as string,
              username: (payload.username as string) || "user",
              email: "",
              employeeId: null,
              roleId: Number(payload.roleId) || 1,
              roleName: (payload.roleName as string) || "User",
              isAdmin: Boolean(payload.isAdmin) || false,
            }
          }

          console.log("Error fetching user:", error)
          return null
        }

        if (!user) {
          console.log("User not found")
          return null
        }

        if (!user.is_active) {
          console.log("User account is not active")
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
      } catch (dbError) {
        console.error("Database error when fetching user:", dbError)

        // Fallback to token data if database fails
        return {
          id: payload.sub as string,
          username: (payload.username as string) || "user",
          email: "",
          employeeId: null,
          roleId: Number(payload.roleId) || 1,
          roleName: (payload.roleName as string) || "User",
          isAdmin: Boolean(payload.isAdmin) || false,
        }
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
  try {
    // Clear the auth token cookie
    const cookieStore = cookies()
    cookieStore.delete("auth_token")

    // Return success instead of redirecting
    // This allows client components to handle the redirect
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Failed to log out" }
  }
}

// Refresh user session
export async function refreshUserSession() {
  try {
    // First, get the current user data
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      console.error("No user found to refresh session")
      return { success: false, error: "No active session found" }
    }

    // Create a new JWT token with fresh data
    const token = await generateJwt(
      currentUser.id,
      currentUser.username,
      currentUser.roleId as number,
      currentUser.roleName,
      currentUser.isAdmin,
    )

    // Store in cookie
    const cookieStore = cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax", // Changed from strict to lax
    })

    console.log("Session refreshed for user:", currentUser.username)

    return { success: true, user: currentUser }
  } catch (error) {
    console.error("Error in refreshUserSession:", error)
    return { success: false, error: "Failed to refresh session" }
  }
}
