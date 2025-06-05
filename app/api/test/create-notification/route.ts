import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 🧪 Test endpoint to create a notification and test real-time updates
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const testNotification = {
      user_id: 1, // Admin user
      type: 'test_alert',
      title: '🧪 Real-Time Test Notification',
      message: `Test notification created at ${new Date().toLocaleTimeString()} - Real-time system working!`,
      severity: 'medium',
      metadata: {
        test: true,
        created_at: new Date().toISOString()
      }
    }

    console.log('🧪 Creating test notification:', testNotification)

    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create test notification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Test notification created successfully:', data)

    return NextResponse.json({ 
      success: true,
      notification: data,
      message: 'Test notification created! Check your notification bell.' 
    })

  } catch (error) {
    console.error('❌ Test notification creation failed:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 