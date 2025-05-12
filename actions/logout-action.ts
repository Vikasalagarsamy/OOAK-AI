"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logoutAction() {
  try {
    // Clear the auth token cookie
    const cookieStore = cookies()
    cookieStore.delete("auth_token")

    // Redirect to login page
    redirect("/login")
  } catch (error) {
    console.error("Logout action error:", error)
    // If there's an error, still try to redirect to login
    redirect("/login?error=logout_failed")
  }
}
