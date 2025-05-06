import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export async function GET() {
  try {
    // Get token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false, reason: "No token found" }, { status: 401 })
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    try {
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ["HS256"],
      })

      return NextResponse.json({
        authenticated: true,
        user: {
          id: payload.sub,
          username: payload.username,
          role: payload.roleName,
        },
      })
    } catch (verifyError) {
      console.error("Token verification error:", verifyError)
      return NextResponse.json({ authenticated: false, reason: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Auth status error:", error)
    return NextResponse.json({ authenticated: false, reason: "Error checking status" }, { status: 500 })
  }
}
