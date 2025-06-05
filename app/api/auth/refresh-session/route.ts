import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { SignJWT } from "jose"
import { jwtVerify } from "jose"

export async function POST() {
  try {
    // Get the current token
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "No token found" }, { status: 401 })
    }

    // Extract user ID from existing token without validation
    let userId
    try {
      const tokenParts = token.split(".")
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString())
        userId = payload.sub
      }
    } catch (parseError) {
      console.error("Failed to parse token:", parseError)
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid token format" }, { status: 401 })
    }

    // Get latest user data
    const supabase = createClient()
    const { data: user, error: userError } = await supabase
      .from("user_accounts")
      .select(`
        id, 
        username, 
        email, 
        is_active, 
        employee_id, 
        role_id,
        roles:role_id (
          id, 
          title, 
          description
        )
      `)
      .eq("id", userId)
      .single()

    if (userError || !user || !user.is_active) {
      return NextResponse.json({ success: false, error: "User not found or inactive" }, { status: 403 })
    }

    // Create a new token
    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email || "",
      employeeId: user.employee_id,
      roleId: user.role_id,
      roleName: user.roles?.title || "",
      isAdmin: user.roles?.title === "Administrator" || user.role_id === 1,
    }

    const newToken = await new SignJWT({
      sub: user.id.toString(),
      username: user.username,
      role: user.role_id,
      roleName: user.roles?.title,
      isAdmin: user.roles?.title === "Administrator" || user.role_id === 1,
      iat: Math.floor(Date.now() / 1000),
      jti: `${user.id}-${Date.now()}`,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secretKey)

    // Set the new token in a cookie
    const response = NextResponse.json({ success: true, user: userData })
    response.cookies.set({
      name: "auth_token",
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
    })

    // Log successful refresh
    await supabase.from("auth_logs").insert({
      user_id: user.id,
      action: "token_refresh",
      status: "success",
      details: "Token refreshed via API",
    })

    return response
  } catch (error) {
    console.error("Session refresh error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
