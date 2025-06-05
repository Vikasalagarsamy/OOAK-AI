import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types/notifications'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('user_id')
    
    // Convert to number to match database schema
    const userId = userIdParam ? 
      (typeof userIdParam === 'string' ? parseInt(userIdParam) : userIdParam) :
      (typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id)
      
    console.log('🔍 GET /api/notifications - userId:', userId, 'type:', typeof userId)
    
    const limit = parseInt(searchParams.get('limit') || '100')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    const supabase = createClient()

    // Get notifications query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error: notificationsError } = await query

    if (notificationsError) {
      console.error('🔍 GET /api/notifications - Error fetching notifications:', notificationsError)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (countError) {
      console.error('🔍 GET /api/notifications - Error fetching unread count:', countError)
    }

    console.log('🔍 GET /api/notifications - Found', notifications?.length || 0, 'notifications, unread:', unreadCount)

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total: (notifications || []).length
    })

  } catch (error) {
    console.error('🔍 GET /api/notifications - Exception:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      user_id,
      type,
      priority = 'medium',
      title,
      message,
      quotation_id,
      action_url,
      action_label,
      expires_at,
      metadata
    } = body

    const supabase = createClient()

    // Create notification
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        id: notificationId,
        user_id,
        type,
        priority,
        title,
        message,
        quotation_id,
        is_read: false,
        created_at: new Date().toISOString(),
        expires_at,
        action_url,
        action_label,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notification }, { status: 201 })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
} 