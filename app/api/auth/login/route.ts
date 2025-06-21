import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/postgresql-client"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  // Set JSON content type header immediately
  const headers = {
    'Content-Type': 'application/json',
  }

  try {
    console.log("🔐 Login request received")
    
    const body = await request.json()
    const { username, password } = body
    
    console.log("👤 Login attempt for username:", username)

    if (!username || !password) {
      console.log("❌ Missing username or password")
      return new NextResponse(
        JSON.stringify({ success: false, error: "Username and password are required" }),
        { status: 400, headers }
      )
    }

    console.log("🐘 Using PostgreSQL client from lib")

    // Get user from database using the postgresql-client
    const result = await query(`
      SELECT 
        e.id,
        e.username,
        e.email,
        e.password_hash,
        e.is_active,
        e.role_id,
        r.title as role_title
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      WHERE LOWER(e.username) = LOWER($1)
    `, [username])

    console.log("🔍 Database query result:", { 
      userFound: result.rows.length > 0,
      username: result.rows[0]?.username,
      roleId: result.rows[0]?.role_id,
      isActive: result.rows[0]?.is_active
    })

    if (result.rows.length === 0) {
      console.error("❌ User not found:", username)
      return new NextResponse(
        JSON.stringify({ success: false, error: "Invalid credentials" }),
        { status: 401, headers }
      )
    }

    const user = result.rows[0]

    // Check password - handle both plain text and bcrypt hashed passwords
    let isValidPassword = false
    
    if (user.password_hash && user.password_hash.startsWith('$2b$')) {
      // Bcrypt hashed password
      isValidPassword = await bcrypt.compare(password, user.password_hash)
      console.log("🔑 Bcrypt password validation result:", isValidPassword)
    } else {
      // Plain text password (legacy)
      isValidPassword = password === user.password_hash
      console.log("🔑 Plain text password validation result:", isValidPassword)
    }

    if (!isValidPassword) {
      console.error("❌ Invalid password for user:", username)
      return new NextResponse(
        JSON.stringify({ success: false, error: "Invalid credentials" }),
        { status: 401, headers }
      )
    }

    // Check if user is active
    if (!user.is_active) {
      console.log("❌ Account inactive:", username)
      return new NextResponse(
        JSON.stringify({ success: false, error: "Account is inactive" }),
        { status: 403, headers }
      )
    }

    console.log("👑 User role:", user.role_title)

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role_id,
        roleName: user.role_title || "User",
        isAdmin: user.role_title === "Administrator" || user.role_id === 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      jwtSecret
    )

    console.log("🎟️ JWT token generated")

    // Create response
    const responseData = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_title || "User",
        isAdmin: user.role_title === "Administrator" || user.role_id === 1
      }
    }

    // Create response with cookie
    const response = new NextResponse(JSON.stringify(responseData), { 
      status: 200,
      headers
    })

    // Set the auth token cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
    })

    console.log("✅ Login successful for:", username)
    return response

  } catch (error) {
    console.error("❌ Login error:", error)
    return new NextResponse(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers }
    )
  }
}
