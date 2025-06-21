import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 [NOTIFICATIONS SIMPLE] Starting notifications API via PostgreSQL...')
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('❌ [NOTIFICATIONS SIMPLE] No current user found')
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }
    
    console.log(`✅ [NOTIFICATIONS SIMPLE] User authenticated: ${currentUser.username}, ID: ${currentUser.id}`)
    
    try {
      const result = await query(`
        SELECT *
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 100
      `, [parseInt(currentUser.id.toString())])

      const notifications = result.rows.map(notification => ({
        ...notification,
        metadata: typeof notification.metadata === 'string' 
          ? JSON.parse(notification.metadata) 
          : notification.metadata
      }))

      console.log(`✅ [NOTIFICATIONS SIMPLE] Successfully fetched ${notifications.length} notifications via PostgreSQL`)
      
      return NextResponse.json({
        notifications: notifications,
        count: notifications.length
      })
      
    } catch (dbError) {
      console.error('❌ [NOTIFICATIONS SIMPLE] Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: dbError instanceof Error ? dbError.message : 'Database error' },
        { status: 500 }
      )
    }
    
  } catch (error: any) {
    console.error('❌ [NOTIFICATIONS SIMPLE] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
