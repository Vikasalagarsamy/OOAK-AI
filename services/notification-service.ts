"use server"

import { query, transaction } from "@/lib/postgresql-client"

export interface Notification {
  id?: number
  user_id: number
  title: string
  message: string
  type?: string
  read?: boolean
  action_url?: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('📬 Creating notification via PostgreSQL:', notification.title)

    const result = await query(`
      INSERT INTO notifications (
        user_id, title, message, type, read, 
        action_url, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [
      notification.user_id,
      notification.title,
      notification.message,
      notification.type || 'info',
      notification.read || false,
      notification.action_url || null,
      JSON.stringify(notification.metadata || {})
    ])

    console.log('✅ Notification created successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error creating notification (PostgreSQL):", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    console.log('📬 Marking notification as read via PostgreSQL:', id)

    const result = await query(`
      UPDATE notifications 
      SET read = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Notification not found"
      }
    }

    console.log('✅ Notification marked as read successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error marking notification as read (PostgreSQL):", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getUserNotifications(userId: number, limit: number = 20, unreadOnly: boolean = false) {
  try {
    console.log('📬 Fetching user notifications via PostgreSQL:', userId)

    let whereClause = 'WHERE user_id = $1'
    const params = [userId]
    
    if (unreadOnly) {
      whereClause += ' AND read = false'
    }

    const result = await query(`
      SELECT *
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
    `, [...params, limit])

    // Process metadata
    const notifications = result.rows.map(notification => ({
      ...notification,
      metadata: typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata) 
        : notification.metadata
    }))

    console.log('✅ User notifications fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: notifications
    }
  } catch (error) {
    console.error("Error fetching user notifications (PostgreSQL):", error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

export async function getUnreadCount(userId: number) {
  try {
    console.log('📬 Fetching unread count via PostgreSQL:', userId)

    const result = await query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND read = false
    `, [userId])

    console.log('✅ Unread count fetched successfully via PostgreSQL')
    
    return {
      success: true,
      count: parseInt(result.rows[0].count)
    }
  } catch (error) {
    console.error("Error fetching unread count (PostgreSQL):", error)
    return {
      success: false,
      error: error.message,
      count: 0
    }
  }
}

export async function markAllAsRead(userId: number) {
  try {
    console.log('📬 Marking all notifications as read via PostgreSQL:', userId)

    const result = await query(`
      UPDATE notifications 
      SET read = true, updated_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING id
    `, [userId])

    console.log('✅ All notifications marked as read successfully via PostgreSQL')
    
    return {
      success: true,
      updated_count: result.rows.length
    }
  } catch (error) {
    console.error("Error marking all notifications as read (PostgreSQL):", error)
    return {
      success: false,
      error: error.message,
      updated_count: 0
    }
  }
}

export async function deleteNotification(id: number) {
  try {
    console.log('📬 Deleting notification via PostgreSQL:', id)

    const result = await query(`
      DELETE FROM notifications 
      WHERE id = $1
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Notification not found"
      }
    }

    console.log('✅ Notification deleted successfully via PostgreSQL')
    
    return {
      success: true,
      data: { id: result.rows[0].id }
    }
  } catch (error) {
    console.error("Error deleting notification (PostgreSQL):", error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function createBulkNotifications(notifications: Omit<Notification, 'id' | 'created_at' | 'updated_at'>[]) {
  try {
    console.log('📬 Creating bulk notifications via PostgreSQL:', notifications.length)

    const values = notifications.map((notification, index) => {
      const baseIndex = index * 7
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`
    }).join(', ')

    const params = notifications.flatMap(notification => [
      notification.user_id,
      notification.title,
      notification.message,
      notification.type || 'info',
      notification.read || false,
      notification.action_url || null,
      JSON.stringify(notification.metadata || {})
    ])

    const result = await query(`
      INSERT INTO notifications (
        user_id, title, message, type, read, 
        action_url, metadata, created_at, updated_at
      ) VALUES ${values}
      RETURNING *
    `, params)

    console.log('✅ Bulk notifications created successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows,
      count: result.rows.length
    }
  } catch (error) {
    console.error("Error creating bulk notifications (PostgreSQL):", error)
    return {
      success: false,
      error: error.message,
      data: [],
      count: 0
    }
  }
}
