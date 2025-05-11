import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export async function GET() {
  try {
    // Get the auth token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 })
    }

    // Verify the token
    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    try {
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ["HS256"],
      })

      // Return authentication status and basic user info
      return NextResponse.json(
        {
          authenticated: true,
          user: {
            id: payload.sub,
            username: payload.username,
            roleName: payload.roleName,
            isAdmin: payload.isAdmin || payload.roleName === "Administrator",
          },
        },
        { status: 200 },
      )
    } catch (error) {
      // Token is invalid
      return NextResponse.json({ authenticated: false, user: null, error: "Invalid token" }, { status: 200 })
    }
  } catch (error) {
    console.error("Error checking auth status:", error)
    return NextResponse.json({ authenticated: false, user: null, error: "Server error" }, { status: 500 })
  }
}
