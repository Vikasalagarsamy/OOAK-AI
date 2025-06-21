import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    // Use the same working authentication pattern as /api/auth/status
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)

    try {
      const { payload } = await jwtVerify(authToken, secretKey, {
        algorithms: ["HS256"],
      })

      if (!payload.sub) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: payload.sub,
          username: payload.username || "",
          firstName: payload.firstName || "",
          lastName: payload.lastName || "",
          email: payload.email || "",
          employeeId: payload.employeeId,
          role: payload.role,
          roleName: payload.roleName || "",
          isAdmin: payload.isAdmin || false
        }
      })

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('❌ Auth user API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 