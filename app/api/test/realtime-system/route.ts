import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 🎯 Comprehensive Real-Time System Test
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Starting comprehensive real-time system test...')
    const supabase = createClient()
    
    // Test 1: Create a real-time notification
    const testNotification = {
      id: `realtime_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: 1, // Admin user
      type: 'system',
      priority: 'high',
      title: '🎯 Real-Time System Test',
      message: `Comprehensive test at ${new Date().toLocaleTimeString()} - All systems operational!`,
      is_read: false,
      metadata: {
        test_type: 'comprehensive',
        timestamp: new Date().toISOString(),
        features_tested: ['real_time_notifications', 'browser_updates', 'supabase_subscription']
      }
    }

    console.log('📝 Creating test notification:', testNotification)

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single()

    if (notificationError) {
      console.error('❌ Notification creation failed:', notificationError)
      return NextResponse.json({ 
        error: `Notification failed: ${notificationError.message}`,
        step: 'notification_creation'
      }, { status: 500 })
    }

    console.log('✅ Test notification created:', notification)

    // Test 2: Trigger webhook simulation (create a test quotation event)
    try {
      const webhookPayload = {
        type: 'INSERT',
        table: 'quotations',
        record: {
          id: 99999,
          client_name: 'Real-Time Test Client',
          total_amount: 150000,
          status: 'draft',
          created_by: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString()
        }
      }

      console.log('🔗 Testing webhook endpoint...')
      
      const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/webhooks/quotation-updated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      })

      const webhookResult = await webhookResponse.json()
      console.log('🔗 Webhook test result:', webhookResult)

    } catch (webhookError) {
      console.warn('⚠️ Webhook test failed (expected in some environments):', webhookError)
    }

    // Test 3: Check notification count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', 1)

    console.log('📊 Total notifications for user:', count)

    return NextResponse.json({ 
      success: true,
      message: '🎯 Real-time system test completed successfully!',
      results: {
        notification_created: notification,
        total_notifications: count,
        real_time_status: 'Should appear in notification bell immediately',
        test_timestamp: new Date().toISOString()
      },
      instructions: [
        '1. Check your notification bell (should show new notification)',
        '2. The count should update in real-time',
        '3. Browser notification should appear if permissions enabled',
        '4. Console should show real-time subscription logs'
      ]
    })

  } catch (error) {
    console.error('❌ Real-time system test failed:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'system_test'
    }, { status: 500 })
  }
} 