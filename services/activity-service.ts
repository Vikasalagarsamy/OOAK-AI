"use server"

import { query, transaction } from "@/lib/postgresql-client"

export interface Activity {
  id?: number
  type: string
  description: string
  entity_type?: string
  entity_id?: number
  metadata?: any
  created_by?: number
  created_at?: string
  updated_at?: string
}

export async function logActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('📝 Logging activity via PostgreSQL:', activity.type)

    const result = await query(`
      INSERT INTO activities (
        action_type, description, entity_type, entity_id, 
        entity_name, user_name
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      activity.type,
      activity.description,
      activity.entity_type || null,
      activity.entity_id?.toString() || null,
      activity.entity_type || 'unknown',
      'System'
    ])

    console.log('✅ Activity logged successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error logging activity (PostgreSQL):", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getRecentActivities(limit: number = 20) {
  try {
    console.log('📊 Fetching recent activities via PostgreSQL...')

    const result = await query(`
      SELECT 
        a.*,
        a.action_type as type
      FROM activities a
      ORDER BY a.created_at DESC
      LIMIT $1
    `, [limit])

    // Process and format activities
    const activities = result.rows.map(activity => ({
      ...activity,
      type: activity.action_type,
      timestamp: activity.created_at,
      user: activity.user_name || 'System'
    }))

    console.log('✅ Recent activities fetched successfully via PostgreSQL')
    
    return activities
  } catch (error) {
    console.error("Error fetching recent activities (PostgreSQL):", error)
    
    // Return fallback mock data
    return [
      {
        id: 1,
        type: "lead_created",
        description: "New lead added",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: "System",
        metadata: {}
      },
      {
        id: 2,
        type: "quotation_sent",
        description: "Quotation sent to client",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user: "System",
        metadata: {}
      }
    ]
  }
}

export async function getActivitiesByEntity(entityType: string, entityId: number, limit: number = 10) {
  try {
    console.log(`📊 Fetching activities for ${entityType}:${entityId} via PostgreSQL...`)

    const result = await query(`
      SELECT 
        a.*,
        a.action_type as type
      FROM activities a
      WHERE a.entity_type = $1 AND a.entity_id = $2
      ORDER BY a.created_at DESC
      LIMIT $3
    `, [entityType, entityId.toString(), limit])

    const activities = result.rows.map(activity => ({
      ...activity,
      type: activity.action_type,
      timestamp: activity.created_at,
      user: activity.user_name || 'System'
    }))

    console.log('✅ Entity activities fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: activities
    }
  } catch (error) {
    console.error("Error fetching entity activities (PostgreSQL):", error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

export async function getActivityStats() {
  try {
    console.log('📊 Fetching activity stats via PostgreSQL...')

    const result = await query(`
      SELECT 
        action_type as type,
        COUNT(*) as count,
        DATE_TRUNC('day', created_at) as day
      FROM activities 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY action_type, DATE_TRUNC('day', created_at)
      ORDER BY day DESC, count DESC
    `)

    console.log('✅ Activity stats fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows
    }
  } catch (error) {
    console.error("Error fetching activity stats (PostgreSQL):", error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}
