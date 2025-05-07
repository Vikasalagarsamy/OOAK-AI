import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default function LogoutPage() {
  // Clear the auth token cookie
  cookies().delete("auth_token")

  // Redirect to login page
  redirect("/login")

  // This won't be rendered due to the redirect
  return null
}
