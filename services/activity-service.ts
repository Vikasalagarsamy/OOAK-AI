"use server"

import { createClient } from "@/lib/supabase"

export type ActivityType =
  | "company"
  | "branch"
  | "employee"
  | "client"
  | "vendor"
  | "supplier"
  | "department"
  | "designation"
  | "role"
  | "lead"
  | "follow_up"

interface LogActivityProps {
  actionType: string
  entityType: ActivityType
  entityId: string
  entityName: string
  description: string
  userName: string
}

export async function logActivity({
  actionType,
  entityType,
  entityId,
  entityName,
  description,
  userName,
}: LogActivityProps) {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("activities").insert({
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      description: description,
      user_name: userName,
    })

    if (error) {
      console.error("Error logging activity:", error)
    }
  } catch (error) {
    console.error("Error in logActivity:", error)
  }
}

export async function getRecentActivities(limit = 5) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching activities:", error)
      return []
    }

    // Transform the data to match the expected format
    return data.map((activity) => ({
      id: activity.id,
      title: `${formatActionType(activity.action_type)} ${activity.entity_type}`,
      description: activity.description,
      timestamp: formatTimeAgo(new Date(activity.created_at)),
      type: activity.entity_type as ActivityType,
      user: {
        name: activity.user_name || "System",
        initials: getInitials(activity.user_name || "System"),
      },
    }))
  } catch (error) {
    console.error("Error in getRecentActivities:", error)
    // Return mock data if there's an error
    return [
      {
        id: "mock-1",
        title: "System Status",
        description: "Database connection is currently unavailable",
        timestamp: "just now",
        type: "company",
        user: {
          name: "System",
          initials: "SY",
        },
      },
    ]
  }
}

// Helper function to format action type
function formatActionType(actionType: string): string {
  switch (actionType) {
    case "create":
      return "New"
    case "update":
      return "Updated"
    case "delete":
      return "Deleted"
    case "status_change":
      return "Status Changed"
    case "assignment":
      return "Assigned"
    default:
      return "Modified"
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`
}

// Helper function to get initials from name
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}
