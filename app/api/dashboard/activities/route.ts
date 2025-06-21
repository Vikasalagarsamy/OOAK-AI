import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgresql-client'
import { verifyAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth()
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const entityType = searchParams.get('entity_type')
    const actionType = searchParams.get('action_type')
    const userId = searchParams.get('user_id')

    console.log(`📈 Fetching dashboard activities (limit: ${limit}, offset: ${offset})`)

    // Build dynamic query
    let whereConditions = []
    let queryParams = []
    let paramCount = 1

    if (entityType) {
      whereConditions.push(`entity_type = $${paramCount}`)
      queryParams.push(entityType)
      paramCount++
    }

    if (actionType) {
      whereConditions.push(`action_type = $${paramCount}`)
      queryParams.push(actionType)
      paramCount++
    }

    if (userId) {
      whereConditions.push(`user_id = $${paramCount}`)
      queryParams.push(parseInt(userId))
      paramCount++
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    // Add limit and offset parameters
    queryParams.push(limit, offset)

    const activitiesQuery = `
      SELECT 
        id,
        user_id,
        user_name,
        action_type,
        entity_type,
        entity_id,
        description,
        metadata,
        created_at,
        -- Format relative time
        CASE 
          WHEN created_at > NOW() - INTERVAL '1 minute' THEN 'Just now'
          WHEN created_at > NOW() - INTERVAL '1 hour' THEN 
            EXTRACT(EPOCH FROM (NOW() - created_at))::integer / 60 || 'm ago'
          WHEN created_at > NOW() - INTERVAL '1 day' THEN 
            EXTRACT(EPOCH FROM (NOW() - created_at))::integer / 3600 || 'h ago'
          WHEN created_at > NOW() - INTERVAL '7 days' THEN 
            EXTRACT(EPOCH FROM (NOW() - created_at))::integer / 86400 || 'd ago'
          ELSE TO_CHAR(created_at, 'MM/DD/YY')
        END as relative_time
      FROM activities
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `

    const activitiesResult = await query(activitiesQuery, queryParams)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activities
      ${whereClause}
    `
    
    const countResult = await query(countQuery, queryParams.slice(0, -2)) // Remove limit/offset params
    const totalCount = parseInt(countResult.rows[0]?.total || '0')

    // Format activities
    const activities = activitiesResult.rows.map(activity => ({
      id: activity.id,
      title: activity.description || `${formatActionType(activity.action_type)} ${formatEntityType(activity.entity_type)}`,
      description: activity.description || `${activity.action_type} operation on ${activity.entity_type}`,
      timestamp: activity.relative_time,
      type: activity.entity_type,
      action: activity.action_type,
      entity_id: activity.entity_id,
      user: activity.user_name ? {
        id: activity.user_id,
        name: activity.user_name,
        initials: getInitials(activity.user_name)
      } : {
        id: null,
        name: 'System',
        initials: 'SY'
      },
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
      created_at: activity.created_at,
      // Add icon based on action and entity type
      icon: getActivityIcon(activity.action_type, activity.entity_type),
      // Add color based on action type
      color: getActivityColor(activity.action_type)
    }))

    // Get activity summary stats
    const summaryQuery = `
      SELECT 
        action_type,
        entity_type,
        COUNT(*) as count
      FROM activities
      WHERE created_at >= CURRENT_DATE
      GROUP BY action_type, entity_type
      ORDER BY count DESC
    `
    
    const summaryResult = await query(summaryQuery)
    const todaysSummary = summaryResult.rows

    const response = {
      activities,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount,
        next_offset: offset + limit < totalCount ? offset + limit : null
      },
      summary: {
        total_activities: totalCount,
        todays_activities: activities.filter(a => 
          new Date(a.created_at).toDateString() === new Date().toDateString()
        ).length,
        todays_breakdown: todaysSummary
      },
      filters_applied: {
        entity_type: entityType,
        action_type: actionType,
        user_id: userId
      },
      last_updated: new Date().toISOString()
    }

    console.log(`✅ Retrieved ${activities.length} activities (${totalCount} total)`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching dashboard activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard activities' },
      { status: 500 }
    )
  }
}

// Helper functions
function formatActionType(actionType: string): string {
  const actionMap: { [key: string]: string } = {
    'CREATE': 'Created',
    'UPDATE': 'Updated',
    'DELETE': 'Deleted',
    'ASSIGN': 'Assigned',
    'COMPLETE': 'Completed',
    'APPROVE': 'Approved',
    'REJECT': 'Rejected',
    'SUBMIT': 'Submitted',
    'SCHEDULE': 'Scheduled',
    'CANCEL': 'Cancelled'
  }
  return actionMap[actionType] || actionType
}

function formatEntityType(entityType: string): string {
  const entityMap: { [key: string]: string } = {
    'lead': 'Lead',
    'client': 'Client',
    'employee': 'Employee',
    'company': 'Company',
    'task': 'Task',
    'notification': 'Notification',
    'quotation': 'Quotation',
    'vendor': 'Vendor',
    'supplier': 'Supplier',
    'branch': 'Branch'
  }
  return entityMap[entityType] || entityType
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

function getActivityIcon(actionType: string, entityType: string): string {
  // Return emoji icons based on action and entity
  const iconMap: { [key: string]: string } = {
    'CREATE_lead': '🎯',
    'UPDATE_lead': '✏️',
    'DELETE_lead': '🗑️',
    'ASSIGN_lead': '👤',
    'CREATE_client': '👥',
    'UPDATE_client': '✏️',
    'DELETE_client': '🗑️',
    'CREATE_employee': '👨‍💼',
    'UPDATE_employee': '✏️',
    'CREATE_task': '📋',
    'COMPLETE_task': '✅',
    'CREATE_notification': '🔔',
    'CREATE_company': '🏢',
    'UPDATE_company': '✏️',
    'CREATE_vendor': '🏪',
    'UPDATE_vendor': '✏️'
  }
  
  const key = `${actionType}_${entityType}`
  return iconMap[key] || '📝'
}

function getActivityColor(actionType: string): string {
  const colorMap: { [key: string]: string } = {
    'CREATE': 'green',
    'UPDATE': 'blue',
    'DELETE': 'red',
    'ASSIGN': 'purple',
    'COMPLETE': 'green',
    'APPROVE': 'green',
    'REJECT': 'red',
    'SUBMIT': 'blue',
    'SCHEDULE': 'orange',
    'CANCEL': 'gray'
  }
  return colorMap[actionType] || 'gray'
} 