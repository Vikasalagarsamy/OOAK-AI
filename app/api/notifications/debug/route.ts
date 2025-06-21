import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    const startTime = Date.now()

    try {
      console.log(`🔍 PostgreSQL notification debug for user: ${currentUser.id}`)

      // Enhanced debug queries with PostgreSQL optimization
      const debugQueries = await Promise.all([
        // 1. All notifications with enhanced metadata
        client.query(`
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
            EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_ago,
            CASE 
              WHEN priority = 'urgent' THEN 4
              WHEN priority = 'high' THEN 3
              WHEN priority = 'medium' THEN 2
              ELSE 1
            END as priority_order
          FROM notifications 
          ORDER BY created_at DESC 
          LIMIT 20
        `),
        
        // 2. Current user's notifications
        client.query(`
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
        `, [currentUser.id]),
        
        // 3. Notification statistics
        client.query(`
          SELECT 
            COUNT(*) as total_notifications,
            COUNT(*) FILTER (WHERE is_read = false) as unread_total,
            COUNT(*) FILTER (WHERE user_id = $1) as user_total,
            COUNT(*) FILTER (WHERE user_id = $1 AND is_read = false) as user_unread,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT type) as unique_types,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as todays_notifications,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_notifications
          FROM notifications
        `, [currentUser.id]),
        
        // 4. Notification types breakdown
        client.query(`
          SELECT 
            type,
            COUNT(*) as count,
            COUNT(*) FILTER (WHERE is_read = false) as unread_count,
            AVG(CASE 
              WHEN priority = 'urgent' THEN 4
              WHEN priority = 'high' THEN 3
              WHEN priority = 'medium' THEN 2
              ELSE 1
            END) as avg_priority_score,
            MAX(created_at) as latest_notification
          FROM notifications
          GROUP BY type
          ORDER BY count DESC
        `),
        
        // 5. User activity breakdown
        client.query(`
          SELECT 
            user_id,
            COUNT(*) as notification_count,
            COUNT(*) FILTER (WHERE is_read = false) as unread_count,
            MAX(created_at) as latest_notification
          FROM notifications
          GROUP BY user_id
          ORDER BY notification_count DESC
          LIMIT 10
        `)
      ])

      const queryTime = Date.now() - startTime

      // Process results
      const [allNotifications, userNotifications, stats, typeBreakdown, userBreakdown] = debugQueries
      
      // Enhanced debug information with PostgreSQL insights
      const debugResponse = {
        debug_info: {
          database: 'PostgreSQL localhost:5432',
          query_performance: `${queryTime}ms`,
          current_user_id: currentUser.id,
          current_user_type: typeof currentUser.id,
          current_user: {
            id: currentUser.id,
            email: currentUser.email,
            username: currentUser.username,
            roleName: currentUser.roleName
          },
          connection_pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          }
        },
        database_statistics: {
          overview: stats.rows[0],
          performance_insights: {
            avg_notifications_per_user: stats.rows[0].unique_users > 0 ? 
              (parseInt(stats.rows[0].total_notifications) / parseInt(stats.rows[0].unique_users)).toFixed(1) : '0',
            engagement_rate: stats.rows[0].total_notifications > 0 ?
              ((parseInt(stats.rows[0].total_notifications) - parseInt(stats.rows[0].unread_total)) / parseInt(stats.rows[0].total_notifications) * 100).toFixed(1) + '%' : '0%',
            daily_activity: stats.rows[0].todays_notifications,
            weekly_growth: stats.rows[0].week_notifications
          }
        },
        notification_analysis: {
          type_breakdown: typeBreakdown.rows,
          user_activity: userBreakdown.rows,
          user_specific: {
            total_notifications: stats.rows[0].user_total,
            unread_notifications: stats.rows[0].user_unread,
            read_percentage: stats.rows[0].user_total > 0 ?
              ((parseInt(stats.rows[0].user_total) - parseInt(stats.rows[0].user_unread)) / parseInt(stats.rows[0].user_total) * 100).toFixed(1) + '%' : '0%'
          }
        },
        all_notifications: allNotifications.rows.map(notification => ({
          ...notification,
          hours_ago: parseFloat(notification.hours_ago).toFixed(1),
          priority_level: notification.priority_order
        })),
        user_notifications: userNotifications.rows.map(notification => ({
          ...notification,
          hours_ago: parseFloat(notification.hours_ago).toFixed(1)
        })),
        system_health: {
          database_responsive: true,
          query_time_acceptable: queryTime < 1000,
          data_integrity: {
            all_notifications_count: allNotifications.rows.length,
            user_notifications_count: userNotifications.rows.length,
            statistics_available: stats.rows.length > 0
          }
        },
        recommendations: {
          performance: queryTime > 500 ? 
            ['Consider adding indexes on user_id and created_at', 'Optimize notification queries'] : 
            ['Database performance is excellent'],
          user_engagement: parseInt(stats.rows[0].user_unread) > 10 ?
            ['User has many unread notifications', 'Consider notification management features'] :
            ['User engagement is healthy'],
          system: [
            'Monitor notification volume trends',
            'Set up automated cleanup for old notifications',
            'Consider notification priority balancing'
          ]
        },
        metadata: {
          source: 'PostgreSQL Direct Connection Debug',
          generated_at: new Date().toISOString(),
          debug_version: '2.0',
          features: [
            'Enhanced Statistics',
            'Performance Monitoring', 
            'Type Analysis',
            'User Activity Tracking',
            'System Health Checks'
          ]
        }
      }

      console.log(`✅ PostgreSQL notification debug completed in ${queryTime}ms`)
      console.log(`   └─ Total notifications: ${stats.rows[0].total_notifications}`)
      console.log(`   └─ User notifications: ${stats.rows[0].user_total}`)
      console.log(`   └─ Unread count: ${stats.rows[0].user_unread}`)

      return NextResponse.json(debugResponse)

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ PostgreSQL notification debug error:', error)
    return NextResponse.json({
      error: 'PostgreSQL notification debug failed',
      details: {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      debug_info: {
        database: 'PostgreSQL localhost:5432',
        error_type: 'Database Connection Error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
} 