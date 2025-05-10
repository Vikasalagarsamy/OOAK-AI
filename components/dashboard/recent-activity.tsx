"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase"
import type { ActivityType } from "@/services/activity-service"
import { useToast } from "@/components/ui/use-toast"
import { Users, FileText, Mail, Calendar } from "lucide-react"

interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  description: string
  timestamp: string
}

function ActivityItem({ icon, title, description, timestamp }: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className="mt-1 bg-muted rounded-full p-2">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          {description} · {timestamp}
        </p>
      </div>
    </div>
  )
}

interface ActivityItemType {
  id: string
  title: string
  description: string
  timestamp: string
  type?: ActivityType
  user?: {
    name: string
    initials: string
  }
}

interface RecentActivityProps {
  activities: ActivityItemType[]
}

export function RecentActivity({ activities: initialActivities }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItemType[]>(initialActivities || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize with the server-provided activities
    setActivities(initialActivities || [])

    // Set up real-time subscription
    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      console.error("Failed to create Supabase client:", err)
      setError("Could not connect to the database for real-time updates")
      toast({
        title: "Connection Error",
        description: "Could not connect to the database for real-time updates",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Subscribe to new activities
    try {
      const subscription = supabase
        .channel("activities-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activities",
          },
          (payload) => {
            try {
              // Format the new activity
              const newActivity = {
                id: payload.new.id,
                title: `${formatActionType(payload.new.action_type)} ${payload.new.entity_type}`,
                description: payload.new.description,
                timestamp: formatTimestamp(payload.new.created_at),
                type: payload.new.entity_type as ActivityType,
                user: payload.new.user_name
                  ? {
                      name: payload.new.user_name,
                      initials: getInitials(payload.new.user_name),
                    }
                  : undefined,
              }

              // Add the new activity to the top of the list
              setActivities((prev) => [newActivity, ...prev.slice(0, 9)])
            } catch (err) {
              console.error("Error processing new activity:", err)
            }
          },
        )
        .subscribe(
          () => {
            setLoading(false)
            setError(null)
          },
          (err) => {
            console.error("Subscription error:", err)
            setLoading(false)
            setError("Failed to subscribe to real-time updates")
          },
        )

      // Clean up subscription on unmount
      return () => {
        subscription.unsubscribe()
      }
    } catch (err) {
      console.error("Error setting up subscription:", err)
      setLoading(false)
      setError("Failed to set up real-time updates")
      return () => {}
    }
  }, [initialActivities, toast])

  const getActivityIcon = (type?: ActivityItemType["type"]) => {
    // Return a default value if type is undefined
    if (!type) return "AC"

    switch (type) {
      case "company":
        return "CO"
      case "branch":
        return "BR"
      case "employee":
        return "EM"
      case "client":
        return "CL"
      case "vendor":
        return "VE"
      case "supplier":
        return "SU"
      case "department":
        return "DP"
      case "designation":
        return "DS"
      case "role":
        return "RO"
      case "lead":
        return "LD"
      default:
        return "AC"
    }
  }

  const getActivityColor = (type?: ActivityItemType["type"]) => {
    // Return a default value if type is undefined
    if (!type) return "bg-gray-100 text-gray-700"

    switch (type) {
      case "company":
        return "bg-blue-100 text-blue-700"
      case "branch":
        return "bg-green-100 text-green-700"
      case "employee":
        return "bg-purple-100 text-purple-700"
      case "client":
        return "bg-amber-100 text-amber-700"
      case "vendor":
        return "bg-rose-100 text-rose-700"
      case "supplier":
        return "bg-emerald-100 text-emerald-700"
      case "department":
        return "bg-indigo-100 text-indigo-700"
      case "designation":
        return "bg-cyan-100 text-cyan-700"
      case "role":
        return "bg-orange-100 text-orange-700"
      case "lead":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // This would normally come from an API or database
  const mockActivities = [
    {
      icon: <Users className="h-4 w-4" />,
      title: "New employee added",
      description: "John Doe was added to Engineering",
      timestamp: "2 hours ago",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Report generated",
      description: "Monthly sales report was generated",
      timestamp: "5 hours ago",
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: "Email campaign sent",
      description: "Quarterly newsletter was sent to 142 subscribers",
      timestamp: "1 day ago",
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      title: "Event scheduled",
      description: "Team building event scheduled for next month",
      timestamp: "2 days ago",
    },
  ]

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across your organization</CardDescription>
          </div>
          {loading && <div className="animate-pulse px-2 py-1 rounded bg-muted text-xs">Listening for updates...</div>}
          {error && <div className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">{error}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities && activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <Avatar className={getActivityColor(activity.type)}>
                    <AvatarFallback>{getActivityIcon(activity.type)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <div className="flex items-center pt-2">
                      {activity.user && (
                        <>
                          <Avatar className="h-5 w-5 mr-1">
                            <AvatarFallback className="text-[10px]">{activity.user.initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground mr-2">{activity.user.name}</span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No recent activities</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Helper functions
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

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

  return date.toLocaleDateString()
}

function getInitials(name: string): string {
  if (!name) return "??"

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}
