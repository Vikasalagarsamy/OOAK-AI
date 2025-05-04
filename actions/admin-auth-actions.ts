"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

interface AdminLoginCredentials {
  username: string
  password: string
}

export async function adminLogin({ username, password }: AdminLoginCredentials) {
  // Validate input
  if (!username || !password) {
    return { success: false, message: "Username and password are required" }
  }

  try {
    // Check for hardcoded admin credentials
    if (username === "Admin" && password === "Admin@123") {
      // Create Supabase client
      const supabase = createClient()

      // Check if the Administrator role exists
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id, name")
        .eq("name", "Administrator")
        .single()

      if (roleError || !roleData) {
        console.error("Error fetching admin role:", roleError)
        return { success: false, message: "Administrator role not found" }
      }

      // Set admin session cookie
      const sessionData = {
        id: "admin-user",
        username: "Admin",
        role: "Administrator",
        roleId: roleData.id,
        isAdmin: true,
      }

      // Set session cookie with 8 hour expiry
      cookies().set("admin_session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 8, // 8 hours
        path: "/",
        sameSite: "strict",
      })

      // Log the successful login
      console.log("Admin login successful:", username)

      // Revalidate paths that might depend on authentication
      revalidatePath("/admin")
      revalidatePath("/")

      return { success: true, message: "Login successful" }
    }

    // If credentials don't match
    return { success: false, message: "Invalid username or password" }
  } catch (error) {
    console.error("Admin login error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function adminLogout() {
  // Clear the admin session cookie
  cookies().delete("admin_session")

  // Revalidate paths
  revalidatePath("/admin")
  revalidatePath("/")

  return { success: true }
}

export async function getAdminSession() {
  const sessionCookie = cookies().get("admin_session")

  if (!sessionCookie?.value) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value)
  } catch (error) {
    console.error("Error parsing admin session:", error)
    cookies().delete("admin_session")
    return null
  }
}

export async function requireAdminAuth() {
  const session = await getAdminSession()

  if (!session || !session.isAdmin) {
    return { redirect: "/admin/login", session: null }
  }

  return { redirect: null, session }
}
