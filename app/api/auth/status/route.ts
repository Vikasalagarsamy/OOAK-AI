import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/postgresql-client"

// Simple JWT payload decode (without verification)
function decodeJWTPayload(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return payload
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      console.log("❌ No auth token found in status check")
      return NextResponse.json({ 
        authenticated: false, 
        user: null,
        message: "No auth token found" 
      })
    }

    // Decode the token payload
    const payload = decodeJWTPayload(token)
    if (!payload || !payload.sub) {
      console.log("❌ Invalid token in status check")
      return NextResponse.json({
        authenticated: false,
        user: null,
        message: "Invalid token"
      })
    }

    console.log("🐘 Using PostgreSQL client from lib for auth status")

    // Use the correct PostgreSQL client
    const result = await query(`
      SELECT 
        e.id,
        e.username,
        e.email,
        e.first_name,
        e.last_name,
        e.role_id,
        e.is_active,
        r.title as role_title
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      WHERE e.id = $1 AND e.is_active = true
    `, [payload.sub])

    if (result.rows.length === 0) {
      console.log("❌ User not found or inactive in status check")
      return NextResponse.json({
        authenticated: false,
        user: null,
        message: "User not found or inactive"
      })
    }

    const employee = result.rows[0]

    const user = {
      id: employee.id,
      username: employee.username,
      email: employee.email,
      firstName: employee.first_name,
      lastName: employee.last_name,
      roleId: employee.role_id,
      roleName: employee.role_title || null,
      isAdmin: employee.role_title === "Administrator" || employee.role_id === 1
    }

    console.log("✅ Auth status check successful for user:", employee.username)

    return NextResponse.json({
      authenticated: true,
      user,
      message: "Authentication successful"
    })

  } catch (error) {
    console.error("Auth status error:", error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      message: "Internal server error"
    }, { status: 500 })
  }
}
