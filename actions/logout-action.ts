"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logoutAction() {
  try {
    // Clear the auth token cookie
    cookies().delete("auth_token")

    // Redirect to login page
    redirect("/login")
  } catch (error) {
    console.error("Logout action error:", error)
    // Still redirect to login even if there's an error
    redirect("/login")
  }
}
