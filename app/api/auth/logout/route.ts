import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  // Clear the auth token cookie
  cookies().delete("auth_token")

  // Return a simple text response
  return new NextResponse("Logged out successfully. Please go back to the login page.", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  })
}

export async function POST() {
  // Clear the auth token cookie
  cookies().delete("auth_token")

  // Return a simple JSON response
  return NextResponse.json({ success: true, message: "Logged out successfully" })
}
