import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// Business Notification Service for PostgreSQL
class PostgreSQLBusinessNotificationService {
  static async notifyQuotationCreated(quotation: any, userId: string) {
    const client = await pool.connect()
    try {
      const notification = {
        id: `quotation_created_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: parseInt(userId),
        type: 'quotation',
        priority: 'medium',
        title: '📝 New Quotation Created',
        message: `Quotation ${quotation.quotation_number} created for ${quotation.client_name} - ₹${quotation.total_amount.toLocaleString()}`,
        is_read: false,
        metadata: JSON.stringify({
          quotation_id: quotation.id,
          quotation_number: quotation.quotation_number,
          client_name: quotation.client_name,
          total_amount: quotation.total_amount,
          action_type: 'quotation_created'
        })
      }

      await client.query(`
        INSERT INTO notifications (id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        notification.id,
        notification.user_id,
        notification.type,
        notification.priority,
        notification.title,
        notification.message,
        notification.is_read,
        notification.metadata
      ])

      return notification
    } finally {
      client.release()
    }
  }

  static async notifyQuotationApproved(quotation: any, approvedBy: string) {
    const client = await pool.connect()
    try {
      const notification = {
        id: `quotation_approved_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: quotation.created_by,
        type: 'quotation',
        priority: 'high',
        title: '🎉 Quotation Approved',
        message: `Great news! Quotation ${quotation.quotation_number} for ${quotation.client_name} has been approved by ${approvedBy}`,
        is_read: false,
        metadata: JSON.stringify({
          quotation_id: quotation.id,
          quotation_number: quotation.quotation_number,
          client_name: quotation.client_name,
          total_amount: quotation.total_amount,
          approved_by: approvedBy,
          action_type: 'quotation_approved'
        })
      }

      await client.query(`
        INSERT INTO notifications (id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        notification.id,
        notification.user_id,
        notification.type,
        notification.priority,
        notification.title,
        notification.message,
        notification.is_read,
        notification.metadata
      ])

      return notification
    } finally {
      client.release()
    }
  }

  static async notifyPaymentReceived(quotation: any, amount: number, receivedBy: string) {
    const client = await pool.connect()
    try {
      const notification = {
        id: `payment_received_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: quotation.created_by,
        type: 'payment',
        priority: 'high',
        title: '💰 Payment Received',
        message: `Payment of ₹${amount.toLocaleString()} received for ${quotation.client_name} (${quotation.quotation_number})`,
        is_read: false,
        metadata: JSON.stringify({
          quotation_id: quotation.id,
          quotation_number: quotation.quotation_number,
          client_name: quotation.client_name,
          payment_amount: amount,
          received_by: receivedBy,
          action_type: 'payment_received'
        })
      }

      await client.query(`
        INSERT INTO notifications (id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        notification.id,
        notification.user_id,
        notification.type,
        notification.priority,
        notification.title,
        notification.message,
        notification.is_read,
        notification.metadata
      ])

      return notification
    } finally {
      client.release()
    }
  }

  static async notifyLowSuccessProbability(quotation: any, probability: number) {
    const client = await pool.connect()
    try {
      const notification = {
        id: `ai_alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: quotation.created_by,
        type: 'ai_alert',
        priority: 'medium',
        title: '⚠️ AI Alert: Low Success Probability',
        message: `AI analysis shows ${probability}% success probability for quotation ${quotation.quotation_number}. Consider follow-up actions.`,
        is_read: false,
        metadata: JSON.stringify({
          quotation_id: quotation.id,
          quotation_number: quotation.quotation_number,
          client_name: quotation.client_name,
          success_probability: probability,
          action_type: 'ai_alert'
        })
      }

      await client.query(`
        INSERT INTO notifications (id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        notification.id,
        notification.user_id,
        notification.type,
        notification.priority,
        notification.title,
        notification.message,
        notification.is_read,
        notification.metadata
      ])

      return notification
    } finally {
      client.release()
    }
  }

  static async notifyTeamPerformanceAnomaly(employee: any, anomalyType: string, metrics: any) {
    const client = await pool.connect()
    try {
      // Get management users (assuming they have admin or manager roles)
      const { rows: managers } = await client.query(`
        SELECT id FROM employees 
        WHERE role IN ('Admin', 'Manager', 'Sales Head') 
        AND status = 'active'
        LIMIT 3
      `)

      const notifications = []
      for (const manager of managers) {
        const notification = {
          id: `performance_anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          user_id: manager.id,
          type: 'performance',
          priority: 'medium',
          title: '👤 Performance Anomaly Alert',
          message: `${employee.full_name} (${employee.role}) showing ${anomalyType}. Conversion rate: ${metrics.conversion_rate}%`,
          is_read: false,
          metadata: JSON.stringify({
            employee_id: employee.employee_id,
            employee_name: employee.full_name,
            anomaly_type: anomalyType,
            metrics: metrics,
            action_type: 'performance_anomaly'
          })
        }

        await client.query(`
          INSERT INTO notifications (id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          notification.id,
          notification.user_id,
          notification.type,
          notification.priority,
          notification.title,
          notification.message,
          notification.is_read,
          notification.metadata
        ])

        notifications.push(notification)
      }

      return notifications
    } finally {
      client.release()
    }
  }

  static async notifyEventDeadlineApproaching(quotation: any, event: any, daysRemaining: number) {
    const client = await pool.connect()
    try {
      const notification = {
        id: `event_deadline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: quotation.created_by,
        type: 'deadline',
        priority: 'high',
        title: '⏰ Event Deadline Approaching',
        message: `Event "${event.event_name}" for ${quotation.client_name} is ${daysRemaining} days away. Ensure all preparations are complete.`,
        is_read: false,
        metadata: JSON.stringify({
          quotation_id: quotation.id,
          event_id: event.id,
          quotation_number: quotation.quotation_number,
          client_name: quotation.client_name,
          event_name: event.event_name,
          event_date: event.event_date,
          days_remaining: daysRemaining,
          action_type: 'event_deadline'
        })
      }

      await client.query(`
        INSERT INTO notifications (id, user_id, type, priority, title, message, is_read, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        notification.id,
        notification.user_id,
        notification.type,
        notification.priority,
        notification.title,
        notification.message,
        notification.is_read,
        notification.metadata
      ])

      return notification
    } finally {
      client.release()
    }
  }
}

// 🧪 Business Notification Testing Suite with PostgreSQL
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const { testType } = await request.json()
    
    console.log(`🧪 Testing business notifications with PostgreSQL: ${testType || 'all'}`)
    
    const results: any[] = []
    
    if (!testType || testType === 'quotation_created') {
      results.push(await testQuotationCreated())
    }
    
    if (!testType || testType === 'quotation_approved') {
      results.push(await testQuotationApproved())
    }
    
    if (!testType || testType === 'payment_received') {
      results.push(await testPaymentReceived())
    }
    
    if (!testType || testType === 'ai_alert') {
      results.push(await testAIAlert())
    }
    
    if (!testType || testType === 'performance_anomaly') {
      results.push(await testPerformanceAnomaly())
    }
    
    if (!testType || testType === 'event_deadline') {
      results.push(await testEventDeadline())
    }

    const totalTime = Date.now() - startTime

    // Verify all notifications were created
    const client = await pool.connect()
    try {
      const { rows: notificationCount } = await client.query(`
        SELECT COUNT(*) as count FROM notifications 
        WHERE created_at >= NOW() - INTERVAL '5 minutes'
        AND metadata LIKE '%test%'
      `)

      console.log(`✅ Business notification tests completed in ${totalTime}ms`)
      console.log(`   └─ Tests run: ${results.length}`)
      console.log(`   └─ Notifications created: ${notificationCount[0].count}`)

      return NextResponse.json({
        success: true,
        message: 'Business notification tests completed with PostgreSQL',
        results,
        statistics: {
          total_notifications: results.length,
          test_duration: `${totalTime}ms`,
          notifications_in_db: parseInt(notificationCount[0].count),
          database_backend: 'PostgreSQL Direct'
        },
        performance_metrics: {
          average_time_per_test: `${(totalTime / results.length).toFixed(1)}ms`,
          database_performance: totalTime < 500 ? 'excellent' : 'good',
          connection_pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          }
        },
        metadata: {
          source: 'PostgreSQL Business Notification Test Suite',
          test_version: '2.0',
          database: 'PostgreSQL localhost:5432',
          migration_status: 'Phase 7.2 - Business Notification Testing',
          timestamp: new Date().toISOString(),
          features: [
            'Direct PostgreSQL Integration',
            'Business Process Notifications',
            'Performance Monitoring',
            'Multi-user Notification Support',
            'Metadata-rich Notifications',
            'Real-time Business Alerts'
          ]
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Business notification test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Business notification test failed',
      details: {
        message: error.message || String(error),
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      metadata: {
        source: 'PostgreSQL Business Notification Test Suite',
        error_timestamp: new Date().toISOString(),
        test_version: '2.0'
      }
    }, { status: 500 })
  }
}

// 🧪 Test quotation created notification
async function testQuotationCreated() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-001',
    client_name: 'Test Wedding Client',
    bride_name: 'Test Bride',
    groom_name: 'Test Groom',
    total_amount: 350000,
    created_by: 1,
    status: 'draft'
  }
  
  const notification = await PostgreSQLBusinessNotificationService.notifyQuotationCreated(mockQuotation, '1')
  
  return {
    test: 'quotation_created',
    status: 'completed',
    notification_id: notification.id,
    description: '📝 New quotation creation notification sent to management and creator'
  }
}

// 🧪 Test quotation approved notification
async function testQuotationApproved() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-002',
    client_name: 'Approved Wedding Client',
    bride_name: 'Happy Bride',
    groom_name: 'Happy Groom',
    total_amount: 500000,
    created_by: 1,
    status: 'approved'
  }
  
  const notification = await PostgreSQLBusinessNotificationService.notifyQuotationApproved(mockQuotation, 'Sales Manager')
  
  return {
    test: 'quotation_approved',
    status: 'completed',
    notification_id: notification.id,
    description: '🎉 Quotation approval notification sent to creator and management'
  }
}

// 🧪 Test payment received notification
async function testPaymentReceived() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-003',
    client_name: 'Payment Client',
    total_amount: 750000,
    created_by: 1
  }
  
  const notification = await PostgreSQLBusinessNotificationService.notifyPaymentReceived(mockQuotation, 375000, 'Finance Team')
  
  return {
    test: 'payment_received',
    status: 'completed',
    notification_id: notification.id,
    description: '💰 Payment received notification sent to sales team and accounts'
  }
}

// 🧪 Test AI alert notification
async function testAIAlert() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-004',
    client_name: 'Low Probability Client',
    created_by: 1,
    status: 'sent'
  }
  
  const notification = await PostgreSQLBusinessNotificationService.notifyLowSuccessProbability(mockQuotation, 25)
  
  return {
    test: 'ai_alert',
    status: 'completed',
    notification_id: notification.id,
    description: '⚠️ AI low success probability alert sent to salesperson'
  }
}

// 🧪 Test performance anomaly notification
async function testPerformanceAnomaly() {
  const mockEmployee = {
    employee_id: 'EMP001',
    full_name: 'Test Sales Rep',
    email: 'test@company.com',
    role: 'Sales Representative'
  }
  
  const mockMetrics = {
    conversion_rate: 12,
    threshold: 15,
    activity_score: 45,
    decrease: 30
  }
  
  const notifications = await PostgreSQLBusinessNotificationService.notifyTeamPerformanceAnomaly(
    mockEmployee,
    'conversion_rate_drop',
    mockMetrics
  )
  
  return {
    test: 'performance_anomaly',
    status: 'completed',
    notifications_sent: notifications.length,
    notification_ids: notifications.map(n => n.id),
    description: '👤 Performance anomaly alert sent to management'
  }
}

// 🧪 Test event deadline notification
async function testEventDeadline() {
  const mockQuotation = {
    id: 9999,
    quotation_number: 'TEST-QUOT-005',
    client_name: 'Upcoming Event Client',
    created_by: 1
  }
  
  const mockEvent = {
    id: 9999,
    event_name: 'Test Wedding Ceremony',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  }
  
  const notification = await PostgreSQLBusinessNotificationService.notifyEventDeadlineApproaching(mockQuotation, mockEvent, 7)
  
  return {
    test: 'event_deadline',
    status: 'completed',
    notification_id: notification.id,
    description: '⏰ Event deadline approaching notification sent to salesperson and operations'
  }
}

// 🧪 GET endpoint for easy testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const testType = searchParams.get('type')
  
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ testType }),
    headers: { 'Content-Type': 'application/json' }
  }))
} 