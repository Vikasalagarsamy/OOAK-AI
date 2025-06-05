import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 📖 Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id
    
    if (!notificationId || notificationId.trim() === '') {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    console.log('🔖 Marking notification as read:', notificationId)

    const supabase = createClient()
    
    // Update the notification to mark as read
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true
      })
      .eq('id', notificationId)

    if (error) {
      console.error('❌ Error marking notification as read:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Notification marked as read successfully:', notificationId)

    return NextResponse.json({ 
      success: true,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('❌ Error in notification read endpoint:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 