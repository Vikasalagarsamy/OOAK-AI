import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id } = body
    const targetUserId = user_id || currentUser.id

    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', targetUserId)
      .eq('is_read', false)
      .select()

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      updated_count: (data || []).length
    })

  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
} 