import { createClient } from "@/lib/supabase-client"
import type { Notification } from "@/types/notification"

const supabase = createClient()

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    // Validate UUID format before querying
    if (!isValidUUID(userId)) {
      console.warn(`Invalid UUID format: ${userId}. Skipping notifications query.`)
      return [] // Return empty array instead of throwing an error
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching notifications:", error)
      throw new Error("Failed to fetch notifications")
    }

    return data as Notification[]
  } catch (error) {
    console.error("Error in getNotifications:", error)
    throw error
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      console.warn(`Invalid UUID format: ${id}. Skipping update.`)
      return
    }

    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

    if (error) {
      console.error("Error marking notification as read:", error)
      throw new Error("Failed to update notification")
    }
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error)
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      console.warn(`Invalid UUID format: ${userId}. Skipping update.`)
      return
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      throw new Error("Failed to update notifications")
    }
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error)
    throw error
  }
}
