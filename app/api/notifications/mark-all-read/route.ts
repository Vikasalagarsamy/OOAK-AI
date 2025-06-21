import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function PATCH(request: NextRequest) {
  try {
    console.log('🐘 Marking all notifications as read in PostgreSQL...')
    
    // Check for JWT token in cookies (same as working APIs)
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    
    if (!authToken) {
      console.log('❌ No JWT token found in cookies')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
    const secretKey = new TextEncoder().encode(secret)
    
    const { payload } = await jwtVerify(authToken, secretKey, {
      algorithms: ["HS256"],
    })
    
    console.log('✅ JWT token verified for user:', payload.username, 'userId:', payload.sub)
    
    if (!payload.sub) {
      console.log('❌ No user ID in JWT payload')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id } = body
    const targetUserId = user_id || payload.sub

    const client = await pool.connect()

    // Update all unread notifications for the user
    const query = `
      UPDATE notifications 
      SET is_read = true
      WHERE employee_id = $1 AND is_read = false
      RETURNING id, title, is_read
    `
    
    const result = await client.query(query, [targetUserId])
    client.release()

    console.log(`✅ Marked ${result.rows.length} notifications as read in PostgreSQL`)

    return NextResponse.json({ 
      success: true,
      updated_count: result.rows.length,
      updated_notifications: result.rows,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read', details: error.message },
      { status: 500 }
    )
  }
} 