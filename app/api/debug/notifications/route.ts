import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 🔍 Debug endpoint to check notification data
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get all notifications for user 1 (matching main API limit of 100)
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', 1)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate unread count from the fetched data
    const unreadCount = notifications?.filter(n => !n.is_read).length || 0
    
    // Get actual total count from database
    const { count: totalInDb, error: totalError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', 1)

    // Get actual unread count from database
    const { count: unreadInDb, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', 1)
      .eq('is_read', false)
    
    // Get latest test notifications
    const testNotifications = notifications?.filter(n => 
      n.metadata && n.metadata.realtime_test === true
    ) || []

    return NextResponse.json({
      fetched_notifications: notifications?.length || 0,
      calculated_unread_count: unreadCount,
      database_total_count: totalInDb || 0,
      database_unread_count: unreadInDb || 0,
      latest_5_notifications: notifications?.slice(0, 5),
      latest_3_test_notifications: testNotifications.slice(0, 3),
      potential_issue: {
        description: "If fetched_notifications < database_total_count, API limit is too low",
        analysis: `Fetched: ${notifications?.length || 0}, DB Total: ${totalInDb || 0}, Calculated Unread: ${unreadCount}, DB Unread: ${unreadInDb || 0}`
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 