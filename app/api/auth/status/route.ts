import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    try {
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ["HS256"],
      })

      if (!payload.sub) {
        return NextResponse.json({ authenticated: false, user: null })
      }

      // Return user data from JWT payload
      const user = {
        id: payload.sub,
        username: payload.username || "",
        email: payload.email || "",
        firstName: payload.firstName || "",
        lastName: payload.lastName || "",
        roleId: payload.role || "",
        roleName: payload.roleName || "",
        isAdmin: payload.isAdmin || false,
      }

      return NextResponse.json({ authenticated: true, user })
    } catch (verifyError) {
      console.error("Token verification error:", verifyError)
      return NextResponse.json({ authenticated: false, user: null })
    }
  } catch (error) {
    console.error("Auth status error:", error)
    return NextResponse.json({ authenticated: false, user: null, error: "Internal server error" }, { status: 500 })
  }
}
