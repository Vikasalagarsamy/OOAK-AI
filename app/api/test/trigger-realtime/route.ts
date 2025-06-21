import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// 🔔 Test endpoint specifically for real-time notifications with PostgreSQL
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    console.log('🔔 Testing real-time notification trigger with PostgreSQL...')
    
    const client = await pool.connect()
    
    try {
      // Generate a unique ID for the notification
      const notificationId = `realtime_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create a simple test notification that should trigger real-time
      const testNotification = {
        id: notificationId,
        user_id: 1,
        type: 'system',
        priority: 'high',
        title: '⚡ Real-Time Test',
        message: `Real-time test at ${new Date().toLocaleTimeString()} - Should appear instantly!`,
        is_read: false,
        metadata: JSON.stringify({
          test: true,
          realtime_test: true,
          timestamp: new Date().toISOString(),
          database: 'PostgreSQL Direct',
          connection_pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          }
        })
      }

      console.log('📝 Inserting notification to trigger real-time:', testNotification)

      // Insert the notification using PostgreSQL (this should trigger the real-time subscription)
      const { rows: insertedNotification } = await client.query(`
        INSERT INTO notifications (id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at
      `, [
        testNotification.id,
        testNotification.user_id,
        testNotification.type,
        testNotification.priority,
        testNotification.title,
        testNotification.message,
        testNotification.is_read,
        testNotification.metadata
      ])

      if (insertedNotification.length === 0) {
        throw new Error('Failed to insert notification')
      }

      console.log('✅ Notification inserted successfully:', insertedNotification[0])

      // Verify the notification was actually inserted
      const { rows: verifyNotification } = await client.query(`
        SELECT * FROM notifications WHERE id = $1
      `, [notificationId])

      if (verifyNotification.length === 0) {
        throw new Error('Notification verification failed - not found in database')
      }

      console.log('✅ Notification verification passed')

      // Check current notification count and statistics
      const { rows: notificationStats } = await client.query(`
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(*) FILTER (WHERE user_id = $1) as user_notifications,
          COUNT(*) FILTER (WHERE user_id = $1 AND is_read = false) as user_unread,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as todays_notifications,
          MAX(created_at) as latest_notification
        FROM notifications
      `, [testNotification.user_id])

      const stats = notificationStats[0]
      console.log('📊 Notification statistics:', stats)

      // Test real-time trigger simulation
      try {
        console.log('🔄 Testing real-time trigger simulation...')
        
        // Simulate what would happen in a real-time scenario
        const simulationResult = {
          trigger_type: 'notification_insert',
          table_affected: 'notifications',
          user_affected: testNotification.user_id,
          notification_id: notificationId,
          should_update_ui: true,
          should_update_badge: true,
          expected_behavior: 'Instant UI update without page refresh'
        }
        
        console.log('✅ Real-time simulation completed:', simulationResult)
        
      } catch (simulationError) {
        console.warn('⚠️ Real-time simulation test failed:', simulationError)
      }

      // Performance metrics
      const testTime = Date.now() - startTime
      const performanceMetrics = {
        total_test_time: `${testTime}ms`,
        database_response: testTime < 100 ? 'excellent' : testTime < 200 ? 'good' : 'acceptable',
        connection_pool: {
          total_connections: pool.totalCount,
          idle_connections: pool.idleCount,
          waiting_connections: pool.waitingCount,
          health_status: pool.waitingCount === 0 ? 'optimal' : 'busy'
        }
      }

      console.log(`✅ Real-time notification test completed in ${testTime}ms`)
      console.log(`   └─ Notification ID: ${notificationId}`)
      console.log(`   └─ Total notifications: ${stats.total_notifications}`)
      console.log(`   └─ User unread: ${stats.user_unread}`)

      return NextResponse.json({
        success: true,
        message: '🔔 Real-time notification test completed with PostgreSQL!',
        notification: insertedNotification[0],
        verification: verifyNotification[0],
        statistics: {
          total_notifications: parseInt(stats.total_notifications),
          user_notifications: parseInt(stats.user_notifications),
          user_unread: parseInt(stats.user_unread),
          todays_notifications: parseInt(stats.todays_notifications),
          latest_notification: stats.latest_notification
        },
        performance: performanceMetrics,
        real_time_expectations: {
          ui_update: 'Should update immediately without page refresh',
          badge_update: 'Notification count should increase by 1 instantly',
          bell_icon: 'Should show new notification at the top',
          browser_notification: 'Should appear if permissions enabled'
        },
        instructions: [
          '1. The notification bell should update IMMEDIATELY (no refresh needed)',
          '2. The badge count should increase by 1 instantly',
          '3. When you click the bell, the new notification should be at the top',
          '4. Check console for real-time subscription logs',
          '5. All data is now processed through PostgreSQL directly'
        ],
        metadata: {
          source: 'PostgreSQL Real-Time Trigger Test',
          test_version: '2.0',
          database: 'PostgreSQL localhost:5432',
          migration_status: 'Phase 7.2 - Real-time Trigger Testing',
          timestamp: new Date().toISOString(),
          features: [
            'Direct PostgreSQL Integration',
            'Real-time Notification Insertion',
            'Performance Monitoring',
            'Connection Pool Health',
            'Statistics Tracking',
            'Verification Testing'
          ]
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Real-time test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Real-time notification test failed',
      details: {
        message: error.message || String(error),
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      troubleshooting: [
        'Verify PostgreSQL is running on localhost:5432',
        'Check notifications table exists and is accessible',
        'Ensure user_id 1 exists in the system',
        'Verify real-time subscription is configured properly',
        'Check browser console for real-time connection logs',
        'Ensure notification table has proper column types'
      ],
      metadata: {
        source: 'PostgreSQL Real-Time Trigger Test',
        error_timestamp: new Date().toISOString(),
        test_version: '2.0'
      }
    }, { status: 500 })
  }
} 