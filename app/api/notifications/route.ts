import { NextRequest, NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting notifications data from PostgreSQL...')
    
    // Check for JWT token in cookies (same as working auth/status API)
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    
    if (authToken) {
      try {
        console.log('✅ Found JWT token, verifying...')
        const secret = process.env.JWT_SECRET || "fallback-secret-only-for-development"
        const secretKey = new TextEncoder().encode(secret)
        
        const { payload } = await jwtVerify(authToken, secretKey, {
          algorithms: ["HS256"],
        })
        
        console.log('✅ JWT token verified for user:', payload.username, 'userId:', payload.sub)
        
        if (!payload.sub) {
          console.log('❌ No user ID in JWT payload')
          return NextResponse.json({ error: 'User ID not found' }, { status: 404 })
        }

        const client = await pool.connect()
        
        // Get notifications and unread count in a single optimized query
        // Fixed column names to match PostgreSQL schema
        const query = `
          WITH notifications_data AS (
            SELECT *
            FROM notifications 
            WHERE employee_id = $1 OR employee_id IS NULL
            ORDER BY created_at DESC
            LIMIT 50
          ),
          unread_count AS (
            SELECT COUNT(*) as count
            FROM notifications 
            WHERE (employee_id = $1 OR employee_id IS NULL) AND is_read = false
          )
          SELECT 
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', n.id,
                  'employee_id', n.employee_id,
                  'title', n.title,
                  'message', n.message,
                  'type', n.type,
                  'is_read', n.is_read,
                  'created_at', n.created_at,
                  'priority', n.priority,
                  'quotation_id', n.quotation_id,
                  'action_url', n.action_url,
                  'action_label', n.action_label
                ) ORDER BY n.created_at DESC
              ) FILTER (WHERE n.id IS NOT NULL),
              '[]'::json
            ) as notifications,
            uc.count as unread_count
          FROM notifications_data n
          CROSS JOIN unread_count uc
          GROUP BY uc.count
        `

        const result = await client.query(query, [payload.sub])
        client.release()

        const data = result.rows[0]
        const notifications = data?.notifications || []
        const unreadCount = parseInt(data?.unread_count || '0')

        console.log(`✅ Notifications data from PostgreSQL: ${notifications.length} notifications (${unreadCount} unread)`)
        
        return NextResponse.json({
          success: true,
          notifications: notifications,
          unread_count: unreadCount,
          total: notifications.length,
          metadata: {
            source: "Direct PostgreSQL",
            timestamp: new Date().toISOString()
          }
        })
        
      } catch (jwtError: any) {
        console.log('❌ JWT verification failed:', jwtError.message)
        return NextResponse.json({ 
          success: false,
          error: 'Invalid authentication token',
          details: jwtError.message 
        }, { status: 401 })
      }
    }
    
    // If no JWT token found
    console.log('❌ No JWT token found in cookies')
    return NextResponse.json({ 
      success: false,
      error: 'Not authenticated - no token' 
    }, { status: 401 })

  } catch (error: any) {
    console.error("❌ Notifications API error:", error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
