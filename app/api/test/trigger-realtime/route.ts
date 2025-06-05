import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 🔔 Test endpoint specifically for real-time notifications
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Testing real-time notification trigger...')
    const supabase = createClient()
    
    // Generate a unique ID for the notification (since the table uses TEXT PRIMARY KEY)
    const notificationId = `realtime_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create a simple test notification that should trigger real-time
    const testNotification = {
      id: notificationId, // Provide the required ID
      user_id: 1,
      type: 'system',
      priority: 'high',
      title: '⚡ Real-Time Test',
      message: `Real-time test at ${new Date().toLocaleTimeString()} - Should appear instantly!`,
      is_read: false,
      metadata: {
        test: true,
        realtime_test: true,
        timestamp: new Date().toISOString()
      }
    }

    console.log('📝 Inserting notification to trigger real-time:', testNotification)

    // Insert the notification (this should trigger the real-time subscription)
    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to insert notification:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    console.log('✅ Notification inserted successfully:', data)

    // Check current notification count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', 1)

    return NextResponse.json({
      success: true,
      message: '🔔 Real-time notification test completed!',
      notification: data,
      total_notifications: count,
      instructions: [
        '1. The notification bell should update IMMEDIATELY (no refresh needed)',
        '2. The badge count should increase by 1 instantly',
        '3. When you click the bell, the new notification should be at the top',
        '4. Check console for real-time subscription logs'
      ]
    })

  } catch (error) {
    console.error('❌ Real-time test failed:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 