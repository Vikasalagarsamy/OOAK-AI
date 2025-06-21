import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { query, transaction } from '@/lib/postgresql-client'

export async function POST() {
  try {
    console.log('🔐 [REFRESH AUTH] Refreshing session via PostgreSQL auth...')
    
    // Check current user authentication
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      console.log('🔐 No valid session found')
      return NextResponse.json({ error: 'No valid session to refresh' }, { status: 401 })
    }

    // Update user's last_activity timestamp in database
    await query(`
      UPDATE employees
      SET 
        last_activity = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `, [currentUser.id])

    console.log(`✅ [REFRESH AUTH] Session refreshed for user ${currentUser.email} via PostgreSQL`)

    return NextResponse.json({ 
      success: true, 
      message: 'Session refreshed successfully via PostgreSQL',
      user: currentUser.email,
      userId: currentUser.id,
      lastActivity: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Auth refresh error (PostgreSQL):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 