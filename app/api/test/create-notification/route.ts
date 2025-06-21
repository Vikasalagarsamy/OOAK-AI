import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// 🧪 Test endpoint to create a notification and test real-time updates
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
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

    const insertQuery = `
      INSERT INTO notifications (user_id, type, title, message, severity, metadata, created_at, read)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, false)
      RETURNING *
    `
    
    const result = await client.query(insertQuery, [
      testNotification.user_id,
      testNotification.type,
      testNotification.title,
      testNotification.message,
      testNotification.severity,
      JSON.stringify(testNotification.metadata)
    ])

    const createdNotification = result.rows[0]

    if (!createdNotification) {
      console.error('❌ Failed to create test notification: No data returned')
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    console.log('✅ Test notification created successfully:', createdNotification)

    return NextResponse.json({ 
      success: true,
      notification: createdNotification,
      message: 'Test notification created! Check your notification bell.',
      database: {
        id: createdNotification.id,
        created_at: createdNotification.created_at,
        status: 'PostgreSQL connected'
      }
    })

  } catch (error) {
    console.error('❌ Test notification creation failed:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check database connection and notifications table schema'
    }, { status: 500 })
  } finally {
    client.release()
  }
}

// GET endpoint for testing notification system status
export async function GET() {
  const client = await pool.connect()
  try {
    // Test database connection and notifications table
    const dbResult = await client.query('SELECT NOW() as timestamp, version() as pg_version')
    const dbInfo = dbResult.rows[0]
    
    // Check notifications table structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `)
    const columns = tableCheck.rows
    
    // Get notification count
    const countResult = await client.query('SELECT COUNT(*) as total FROM notifications')
    const notificationCount = countResult.rows[0].total
    
    return NextResponse.json({
      status: "✅ Notification Test System Ready",
      database: {
        connected: true,
        timestamp: dbInfo.timestamp,
        version: dbInfo.pg_version,
        notifications_table: {
          exists: columns.length > 0,
          columns: columns.length,
          total_notifications: notificationCount
        }
      },
      test_capabilities: [
        "Create test notifications",
        "Verify real-time updates", 
        "Check database schema",
        "Monitor notification delivery"
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Notification test status error:', error)
    return NextResponse.json({
      status: "❌ Notification Test Error",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    client.release()
  }
} 