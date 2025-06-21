import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST NOTIFICATIONS POSTGRESQL] Starting comprehensive test...')
    
    // Step 1: Test authentication
    const currentUser = await getCurrentUser()
    console.log('🧪 [TEST NOTIFICATIONS POSTGRESQL] getCurrentUser result:', currentUser ? `${currentUser.username} (ID: ${currentUser.id})` : 'null')
    
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        step: 'getCurrentUser',
        details: 'No current user found',
        database: 'PostgreSQL localhost:5432'
      }, { status: 401 })
    }

    // Step 2: Test PostgreSQL connection
    const client = await pool.connect()
    const startTime = Date.now()
    
    try {
      console.log('🧪 [TEST NOTIFICATIONS POSTGRESQL] PostgreSQL client connected')

      // Step 3: Test database connection and table existence
      const { rows: tableCheck } = await client.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
          AND table_schema = 'public'
        ORDER BY ordinal_position
      `)

      if (tableCheck.length === 0) {
        console.error('🧪 [TEST NOTIFICATIONS POSTGRESQL] Notifications table not found')
        return NextResponse.json({
          error: 'Notifications table not found',
          step: 'table_check',
          details: 'The notifications table does not exist in the PostgreSQL database',
          database: 'PostgreSQL localhost:5432'
        }, { status: 500 })
      }

      console.log(`🧪 [TEST NOTIFICATIONS POSTGRESQL] Notifications table found with ${tableCheck.length} columns`)

      // Step 4: Test basic query performance
      const queryStart = Date.now()
      const { rows: countTest } = await client.query('SELECT COUNT(*) as total_count FROM notifications')
      const queryTime = Date.now() - queryStart

      console.log(`🧪 [TEST NOTIFICATIONS POSTGRESQL] Count query completed in ${queryTime}ms`)

      // Step 5: Test notifications query with user ID
      const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id
      console.log('🧪 [TEST NOTIFICATIONS POSTGRESQL] Testing with userId:', userId, 'type:', typeof userId)

      const { rows: notifications } = await client.query(`
        SELECT 
          id,
          user_id,
          type,
          title,
          message,
          priority,
          is_read,
          created_at,
          updated_at,
          metadata,
          EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_ago
        FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC
        LIMIT 5
      `, [userId])

      // Step 6: Advanced PostgreSQL testing - User statistics
      const { rows: userStats } = await client.query(`
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(*) FILTER (WHERE is_read = false) as unread_notifications,
          COUNT(DISTINCT type) as notification_types,
          MAX(created_at) as latest_notification,
          MIN(created_at) as oldest_notification,
          AVG(CASE 
            WHEN priority = 'urgent' THEN 4
            WHEN priority = 'high' THEN 3
            WHEN priority = 'medium' THEN 2
            ELSE 1
          END) as avg_priority_score
        FROM notifications 
        WHERE user_id = $1
      `, [userId])

      // Step 7: System-wide statistics
      const { rows: systemStats } = await client.query(`
        SELECT 
          COUNT(*) as total_system_notifications,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT type) as unique_types,
          AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) as avg_age_hours
        FROM notifications
      `)

      // Step 8: Connection pool health check
      const poolHealth = {
        total_connections: pool.totalCount,
        idle_connections: pool.idleCount,
        waiting_connections: pool.waitingCount
      }

      const totalTime = Date.now() - startTime

      console.log(`🧪 [TEST NOTIFICATIONS POSTGRESQL] Successfully found ${notifications.length} notifications for user`)
      console.log(`🧪 [TEST NOTIFICATIONS POSTGRESQL] Total test time: ${totalTime}ms`)

      return NextResponse.json({
        success: true,
        test_results: {
          authentication: {
            status: 'passed',
            user_found: true,
            user_id: currentUser.id,
            user_type: typeof currentUser.id
          },
          database_connection: {
            status: 'passed',
            database: 'PostgreSQL localhost:5432',
            connection_time: `${totalTime}ms`,
            table_structure: tableCheck,
            pool_health: poolHealth
          },
          query_performance: {
            count_query_time: `${queryTime}ms`,
            total_test_time: `${totalTime}ms`,
            performance_rating: totalTime < 100 ? 'excellent' : 
                               totalTime < 500 ? 'good' : 
                               totalTime < 1000 ? 'acceptable' : 'slow'
          },
          data_validation: {
            table_exists: true,
            columns_count: tableCheck.length,
            total_notifications: parseInt(countTest[0].total_count),
            user_notifications: notifications.length
          }
        },
        user: {
          id: currentUser.id,
          username: currentUser.username,
          roleName: currentUser.roleName,
          parsed_id: userId,
          id_type: typeof userId
        },
        notifications: notifications.map(n => ({
          ...n,
          hours_ago: parseFloat(n.hours_ago).toFixed(1)
        })),
        statistics: {
          user_stats: userStats[0],
          system_stats: systemStats[0]
        },
        performance_insights: {
          query_efficiency: queryTime < 50 ? 'excellent' : 'good',
          connection_pool_usage: `${pool.totalCount} total, ${pool.idleCount} idle`,
          recommendations: totalTime > 500 ? 
            ['Consider adding indexes', 'Optimize notification queries'] : 
            ['Performance is optimal']
        },
        metadata: {
          source: 'PostgreSQL Direct Connection Test',
          test_version: '2.0',
          timestamp: new Date().toISOString(),
          features_tested: [
            'Authentication',
            'Database Connection',
            'Table Structure',
            'Query Performance',
            'User Data Retrieval',
            'Statistics Generation',
            'Connection Pool Health'
          ]
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('🧪 [TEST NOTIFICATIONS POSTGRESQL] Unexpected error:', error)
    return NextResponse.json({
      error: 'PostgreSQL test failed',
      step: 'exception',
      details: {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      database: 'PostgreSQL localhost:5432',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 