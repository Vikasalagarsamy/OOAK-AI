import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Get all notifications (without user filtering for debugging)
    const { data: allNotifications, error: allError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get current user's notifications specifically
    const { data: userNotifications, error: userError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      debug_info: {
        current_user_id: currentUser.id,
        current_user_type: typeof currentUser.id,
        current_user: {
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.username,
          roleName: currentUser.roleName
        }
      },
      all_notifications: allNotifications || [],
      user_notifications: userNotifications || [],
      errors: {
        all_error: allError,
        user_error: userError
      }
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 