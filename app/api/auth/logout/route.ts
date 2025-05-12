import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Clear the auth token cookie
    cookies().delete("auth_token")

    // Return a simple text response
    return new NextResponse("Logged out successfully. Please go back to the login page.", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Logout GET error:", error)
    return new NextResponse("Error during logout", { status: 500 })
  }
}

export async function POST() {
  try {
    // Clear the auth token cookie
    cookies().delete("auth_token")

    // Return a simple JSON response
    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to log out" }, { status: 500 })
  }
}
