"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logoutAction() {
  // Clear the auth token cookie
  cookies().delete("auth_token")

  // Redirect to login page
  // This will throw a REDIRECT error which is expected behavior
  // and should not be caught in a try/catch
  redirect("/login")
}
