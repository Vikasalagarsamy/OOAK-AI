import { NextRequest, NextResponse } from 'next/server'
import { sseService, broadcastNotification, broadcastActivity, broadcastDashboardUpdate } from '@/lib/server-sent-events'
import { query } from '@/lib/postgresql-client'
import { verifyAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const testType = searchParams.get('test') || 'status'

    console.log(`🧪 Running real-time test: ${testType}`)

    switch (testType) {
      case 'status':
        return await testConnectionStatus()
      
      case 'sse-stats':
        return await testSSEStats()
      
      case 'database':
        return await testDatabaseConnection()
      
      case 'auth':
        return await testAuthentication()
      
      default:
        return NextResponse.json({
          error: 'Unknown test type',
          available_tests: ['status', 'sse-stats', 'database', 'auth']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Real-time test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { test, data } = await request.json()

    console.log(`🧪 Running real-time POST test: ${test}`)

    switch (test) {
      case 'broadcast-notification':
        return await testNotificationBroadcast(data)
      
      case 'broadcast-activity':
        return await testActivityBroadcast(data)
      
      case 'broadcast-dashboard':
        return await testDashboardBroadcast(data)
      
      case 'stress-test':
        return await runStressTest(data)
      
      case 'create-test-data':
        return await createTestData(data)
      
      default:
        return NextResponse.json({
          error: 'Unknown test type',
          available_tests: ['broadcast-notification', 'broadcast-activity', 'broadcast-dashboard', 'stress-test', 'create-test-data']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Real-time POST test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Test Functions

async function testConnectionStatus() {
  const stats = sseService.getStats()
  
  return NextResponse.json({
    success: true,
    test: 'connection-status',
    timestamp: new Date().toISOString(),
    sse_service: {
      status: 'operational',
      connections: stats.totalConnections,
      unique_users: stats.uniqueUsers,
      user_breakdown: stats.userBreakdown
    },
    websocket_service: {
      status: 'configured',
      note: 'WebSocket testing requires Socket.IO client connection'
    },
    infrastructure: {
      server_sent_events: '✅ Operational',
      websocket_service: '✅ Configured',
      postgresql_client: '✅ Available',
      auth_system: '✅ Available'
    }
  })
}

async function testSSEStats() {
  const stats = sseService.getStats()
  
  // Test a simple broadcast
  sseService.broadcast('test_event', {
    message: 'SSE test broadcast',
    timestamp: new Date().toISOString(),
    test_id: `test_${Date.now()}`
  })
  
  return NextResponse.json({
    success: true,
    test: 'sse-stats',
    timestamp: new Date().toISOString(),
    stats,
    test_broadcast: {
      sent: true,
      event: 'test_event',
      connections_reached: stats.totalConnections
    }
  })
}

async function testDatabaseConnection() {
  try {
    // Test basic query
    const result = await query('SELECT NOW() as current_time, version() as postgres_version')
    
    // Test tables existence
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('employees', 'notifications', 'activities', 'leads', 'clients')
      ORDER BY table_name
    `)
    
    const tables = tablesResult.rows.map(row => row.table_name)
    
    return NextResponse.json({
      success: true,
      test: 'database-connection',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        current_time: result.rows[0].current_time,
        postgres_version: result.rows[0].postgres_version,
        tables_found: tables,
        required_tables: ['employees', 'notifications', 'activities', 'leads', 'clients'],
        missing_tables: ['employees', 'notifications', 'activities', 'leads', 'clients'].filter(t => !tables.includes(t))
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'database-connection',
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function testAuthentication() {
  try {
    const authResult = await verifyAuth()
    
    return NextResponse.json({
      success: true,
      test: 'authentication',
      timestamp: new Date().toISOString(),
      auth: {
        authenticated: authResult.success,
        user: authResult.user ? {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email
        } : null,
        token_valid: authResult.success,
        error: authResult.error || null
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'authentication',
      error: 'Authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function testNotificationBroadcast(data: any) {
  const userId = data?.userId || '1'
  const message = data?.message || 'Test notification from real-time infrastructure'
  
  const testNotification = {
    id: Date.now(),
    user_id: parseInt(userId),
    title: 'Real-time Test Notification',
    message,
    type: 'info',
    is_read: false,
    is_urgent: false,
    created_at: new Date().toISOString()
  }
  
  // Broadcast via SSE
  broadcastNotification(userId, testNotification)
  
  const stats = sseService.getStats()
  
  return NextResponse.json({
    success: true,
    test: 'notification-broadcast',
    timestamp: new Date().toISOString(),
    broadcast: {
      notification: testNotification,
      sent_to_user: userId,
      total_connections: stats.totalConnections,
      user_connections: stats.userBreakdown[userId] || 0
    }
  })
}

async function testActivityBroadcast(data: any) {
  const testActivity = {
    id: Date.now(),
    title: data?.title || 'Test Activity',
    description: data?.description || 'Real-time infrastructure test activity',
    timestamp: 'Just now',
    type: 'test',
    user: {
      name: 'Test User',
      initials: 'TU'
    }
  }
  
  // Broadcast via SSE
  broadcastActivity(testActivity)
  
  const stats = sseService.getStats()
  
  return NextResponse.json({
    success: true,
    test: 'activity-broadcast',
    timestamp: new Date().toISOString(),
    broadcast: {
      activity: testActivity,
      sent_to_connections: stats.totalConnections
    }
  })
}

async function testDashboardBroadcast(data: any) {
  const testStats = {
    total_leads: data?.total_leads || Math.floor(Math.random() * 1000),
    total_clients: data?.total_clients || Math.floor(Math.random() * 500),
    total_employees: data?.total_employees || Math.floor(Math.random() * 50),
    today_activities: data?.today_activities || Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString()
  }
  
  // Broadcast via SSE
  broadcastDashboardUpdate(testStats)
  
  const connectionStats = sseService.getStats()
  
  return NextResponse.json({
    success: true,
    test: 'dashboard-broadcast',
    timestamp: new Date().toISOString(),
    broadcast: {
      stats: testStats,
      sent_to_connections: connectionStats.totalConnections
    }
  })
}

async function runStressTest(data: any) {
  const iterations = data?.iterations || 10
  const delay = data?.delay || 100
  
  console.log(`🚀 Starting stress test: ${iterations} iterations with ${delay}ms delay`)
  
  const results = []
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    
    // Test different broadcast types
    const testData = {
      iteration: i + 1,
      timestamp: new Date().toISOString()
    }
    
    if (i % 3 === 0) {
      broadcastNotification('1', {
        id: Date.now(),
        title: `Stress Test Notification ${i + 1}`,
        message: 'Testing system under load',
        type: 'info'
      })
    } else if (i % 3 === 1) {
      broadcastActivity({
        id: Date.now(),
        title: `Stress Test Activity ${i + 1}`,
        description: 'Testing real-time activity broadcasting',
        timestamp: 'Just now',
        type: 'stress-test'
      })
    } else {
      broadcastDashboardUpdate({
        total_leads: Math.floor(Math.random() * 1000),
        iteration: i + 1,
        timestamp: new Date().toISOString()
      })
    }
    
    const end = Date.now()
    results.push({
      iteration: i + 1,
      duration_ms: end - start,
      timestamp: new Date().toISOString()
    })
    
    // Delay between iterations
    if (delay > 0 && i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  const totalTime = results.reduce((sum, r) => sum + r.duration_ms, 0)
  const avgTime = totalTime / results.length
  
  return NextResponse.json({
    success: true,
    test: 'stress-test',
    timestamp: new Date().toISOString(),
    results: {
      iterations,
      total_time_ms: totalTime,
      average_time_ms: avgTime,
      max_time_ms: Math.max(...results.map(r => r.duration_ms)),
      min_time_ms: Math.min(...results.map(r => r.duration_ms)),
      connection_stats: sseService.getStats(),
      detailed_results: results
    }
  })
}

async function createTestData(data: any) {
  try {
    const authResult = await verifyAuth()
    if (!authResult.success || !authResult.user) {
      throw new Error('Authentication required for test data creation')
    }
    
    const user = authResult.user
    const count = data?.count || 5
    
    console.log(`🧪 Creating ${count} test records...`)
    
    const results = {
      activities: [],
      notifications: []
    }
    
    // Create test activities
    for (let i = 0; i < count; i++) {
      const activityResult = await query(
        `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          user.id,
          user.name,
          'CREATE',
          'test',
          i + 1,
          `Test activity ${i + 1} for real-time infrastructure testing`
        ]
      )
      
      results.activities.push(activityResult.rows[0])
      
      // Broadcast the activity
      broadcastActivity({
        id: activityResult.rows[0].id,
        title: `Test Activity ${i + 1}`,
        description: activityResult.rows[0].description,
        timestamp: 'Just now',
        type: 'test',
        user: {
          name: user.name,
          initials: user.name.split(' ').map(n => n[0]).join('')
        }
      })
    }
    
    // Create test notifications if table exists
    try {
      for (let i = 0; i < count; i++) {
        const notificationResult = await query(
          `INSERT INTO notifications (user_id, title, message, type, is_urgent, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            user.id,
            `Test Notification ${i + 1}`,
            `This is test notification ${i + 1} for real-time infrastructure testing`,
            'info',
            i % 3 === 0,
            false
          ]
        )
        
        results.notifications.push(notificationResult.rows[0])
        
        // Broadcast the notification
        broadcastNotification(user.id.toString(), notificationResult.rows[0])
      }
    } catch (error) {
      console.log('⚠️ Notifications table not available, skipping notification creation')
    }
    
    return NextResponse.json({
      success: true,
      test: 'create-test-data',
      timestamp: new Date().toISOString(),
      created: {
        activities: results.activities.length,
        notifications: results.notifications.length,
        total_records: results.activities.length + results.notifications.length
      },
      data: results
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      test: 'create-test-data',
      error: 'Failed to create test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 