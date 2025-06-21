"use server"

import { query } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"
import { logActivity } from "@/services/activity-service"
import { addDays, addMinutes, format, parseISO } from "date-fns"

// Function to get upcoming follow-ups that need notifications
export async function getUpcomingNotifications(minutesThreshold = 15) {
  try {
    console.log(`🔔 [NOTIFICATIONS] Fetching upcoming follow-up notifications (${minutesThreshold} min threshold) via PostgreSQL...`)

    const now = new Date()
    const thresholdTime = addMinutes(now, minutesThreshold)

    // Get follow-ups that are scheduled within the threshold time
    const result = await query(`
      SELECT 
        f.id,
        f.scheduled_at,
        f.contact_method,
        f.followup_type,
        f.lead_id,
        f.interaction_summary,
        f.priority,
        f.created_by,
        l.lead_number,
        l.client_name
      FROM lead_followups f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE f.status = 'scheduled'
      AND f.scheduled_at >= $1
      AND f.scheduled_at <= $2
      ORDER BY f.scheduled_at ASC
    `, [now.toISOString(), thresholdTime.toISOString()])

    const notifications = result.rows.map((item) => ({
      id: item.id,
      scheduledAt: item.scheduled_at,
      contactMethod: item.contact_method || item.followup_type,
      leadId: item.lead_id,
      leadNumber: item.lead_number,
      clientName: item.client_name,
      summary: item.interaction_summary,
      priority: item.priority,
      createdBy: item.created_by,
      timeUntil: format(parseISO(item.scheduled_at), "h:mm a"),
    }))

    console.log(`✅ [NOTIFICATIONS] Found ${notifications.length} upcoming notifications`)
    return {
      success: true,
      notifications,
    }
  } catch (error: any) {
    console.error("❌ [NOTIFICATIONS] Error in getUpcomingNotifications:", error)
    return { success: false, error: "Failed to fetch notifications" }
  }
}

// Function to get overdue follow-ups
export async function getOverdueFollowUps() {
  try {
    console.log("⏰ [NOTIFICATIONS] Fetching overdue follow-ups via PostgreSQL...")

    const now = new Date()

    // Get follow-ups that are scheduled in the past but still have status "scheduled"
    const result = await query(`
      SELECT 
        f.id,
        f.scheduled_at,
        f.contact_method,
        f.followup_type,
        f.lead_id,
        f.interaction_summary,
        f.priority,
        f.created_by,
        l.lead_number,
        l.client_name
      FROM lead_followups f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE f.status = 'scheduled'
      AND f.scheduled_at < $1
      ORDER BY f.scheduled_at DESC
    `, [now.toISOString()])

    const overdue = result.rows.map((item) => ({
      id: item.id,
      scheduledAt: item.scheduled_at,
      contactMethod: item.contact_method || item.followup_type,
      leadId: item.lead_id,
      leadNumber: item.lead_number,
      clientName: item.client_name,
      summary: item.interaction_summary,
      priority: item.priority,
      createdBy: item.created_by,
      overdueDays: Math.floor((now.getTime() - new Date(item.scheduled_at).getTime()) / (1000 * 60 * 60 * 24)),
    }))

    console.log(`⚠️ [NOTIFICATIONS] Found ${overdue.length} overdue follow-ups`)
    return {
      success: true,
      overdue,
    }
  } catch (error: any) {
    console.error("❌ [NOTIFICATIONS] Error in getOverdueFollowUps:", error)
    return { success: false, error: "Failed to fetch overdue follow-ups" }
  }
}

// Function to get daily summary of follow-ups
export async function getDailySummary() {
  try {
    console.log("📊 [NOTIFICATIONS] Generating daily follow-up summary via PostgreSQL...")

    const now = new Date()
    const tomorrow = addDays(now, 1)
    const todayStart = format(now, "yyyy-MM-dd")
    const tomorrowStart = format(tomorrow, "yyyy-MM-dd")

    // Get today's completed follow-ups count
    const completedTodayResult = await query(`
      SELECT COUNT(*) as count
      FROM lead_followups
      WHERE status = 'completed'
      AND completed_at >= $1
      AND completed_at < $2
    `, [todayStart, tomorrowStart])

    const completedToday = parseInt(completedTodayResult.rows[0]?.count || '0')

    // Get upcoming follow-ups for tomorrow
    const upcomingTomorrowResult = await query(`
      SELECT 
        f.id,
        f.scheduled_at,
        f.contact_method,
        f.followup_type,
        l.lead_number,
        l.client_name
      FROM lead_followups f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE f.status = 'scheduled'
      AND f.scheduled_at >= $1
      AND f.scheduled_at < $2
      ORDER BY f.scheduled_at ASC
    `, [tomorrowStart, format(addDays(tomorrow, 1), "yyyy-MM-dd")])

    const upcomingTomorrow = upcomingTomorrowResult.rows.map(row => ({
      id: row.id,
      scheduled_at: row.scheduled_at,
      contact_method: row.contact_method || row.followup_type,
      lead: {
        lead_number: row.lead_number,
        client_name: row.client_name
      }
    }))

    // Get overdue follow-ups count
    const overdueCountResult = await query(`
      SELECT COUNT(*) as count
      FROM lead_followups
      WHERE status = 'scheduled'
      AND scheduled_at < $1
    `, [todayStart])

    const overdueCount = parseInt(overdueCountResult.rows[0]?.count || '0')

    console.log(`📈 [NOTIFICATIONS] Daily summary: ${completedToday} completed, ${upcomingTomorrow.length} tomorrow, ${overdueCount} overdue`)

    return {
      success: true,
      summary: {
        completedToday,
        upcomingTomorrow,
        overdueCount,
        date: format(now, "EEEE, MMMM d, yyyy"),
      },
    }
  } catch (error: any) {
    console.error("❌ [NOTIFICATIONS] Error in getDailySummary:", error)
    return { success: false, error: "Failed to generate daily summary" }
  }
}

// Function to mark a follow-up as missed if it's overdue
export async function markOverdueAsMissed() {
  try {
    console.log("🔄 [NOTIFICATIONS] Marking overdue follow-ups as missed via PostgreSQL...")

    const now = new Date()

    // Update follow-ups that are scheduled in the past but still have status "scheduled"
    const result = await query(`
      UPDATE lead_followups 
      SET 
        status = 'missed',
        updated_at = $1
      WHERE status = 'scheduled'
      AND scheduled_at < $1
      RETURNING id, lead_id
    `, [now.toISOString()])

    const updatedFollowUps = result.rows

    console.log(`📝 [NOTIFICATIONS] Marked ${updatedFollowUps.length} follow-ups as missed`)

    // Log activity for each missed follow-up
    if (updatedFollowUps.length > 0) {
      const currentUser = await getCurrentUser()
      const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "System"

      for (const item of updatedFollowUps) {
        await logActivity({
          action: "STATUS_CHANGE",
          entityType: "follow_up",
          entityId: item.id.toString(),
          description: `Follow-up automatically marked as missed`,
        })
      }

      // Revalidate paths
      revalidatePath("/follow-ups")
      revalidatePath("/sales/follow-ups")
    }

    return {
      success: true,
      count: updatedFollowUps.length,
    }
  } catch (error: any) {
    console.error("❌ [NOTIFICATIONS] Error in markOverdueAsMissed:", error)
    return { success: false, error: "Failed to mark overdue follow-ups as missed" }
  }
}

// Get follow-up notification preferences for a user
export async function getNotificationPreferences(userId?: string) {
  try {
    console.log("⚙️ [NOTIFICATIONS] Fetching notification preferences via PostgreSQL...")

    const currentUser = userId ? { id: userId } : await getCurrentUser()
    if (!currentUser?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has notification preferences set
    const result = await query(`
      SELECT 
        email_notifications,
        push_notifications,
        notification_timing,
        created_at,
        updated_at
      FROM user_notification_preferences
      WHERE user_id = $1
    `, [currentUser.id])

    if (result.rows.length === 0) {
      // Return default preferences if none set
      console.log("📋 [NOTIFICATIONS] No preferences found, returning defaults")
      return {
        success: true,
        preferences: {
          email_notifications: true,
          push_notifications: true,
          notification_timing: 15, // 15 minutes before
        }
      }
    }

    const preferences = result.rows[0]
    console.log(`✅ [NOTIFICATIONS] Found notification preferences for user ${currentUser.id}`)

    return {
      success: true,
      preferences: {
        email_notifications: preferences.email_notifications,
        push_notifications: preferences.push_notifications,
        notification_timing: preferences.notification_timing || 15,
      }
    }
  } catch (error: any) {
    console.error("❌ [NOTIFICATIONS] Error in getNotificationPreferences:", error)
    return { success: false, error: "Failed to fetch notification preferences" }
  }
}

// Update notification preferences for a user
export async function updateNotificationPreferences(preferences: {
  email_notifications?: boolean
  push_notifications?: boolean
  notification_timing?: number
}) {
  try {
    console.log("💾 [NOTIFICATIONS] Updating notification preferences via PostgreSQL...")

    const currentUser = await getCurrentUser()
    if (!currentUser?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Upsert notification preferences
    const result = await query(`
      INSERT INTO user_notification_preferences (
        user_id, 
        email_notifications, 
        push_notifications, 
        notification_timing,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, NOW(), NOW()
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        email_notifications = COALESCE($2, user_notification_preferences.email_notifications),
        push_notifications = COALESCE($3, user_notification_preferences.push_notifications),
        notification_timing = COALESCE($4, user_notification_preferences.notification_timing),
        updated_at = NOW()
      RETURNING *
    `, [
      currentUser.id,
      preferences.email_notifications,
      preferences.push_notifications,
      preferences.notification_timing
    ])

    console.log(`✅ [NOTIFICATIONS] Updated notification preferences for user ${currentUser.id}`)

    return {
      success: true,
      preferences: result.rows[0]
    }
  } catch (error: any) {
    console.error("❌ [NOTIFICATIONS] Error in updateNotificationPreferences:", error)
    return { success: false, error: "Failed to update notification preferences" }
  }
}
