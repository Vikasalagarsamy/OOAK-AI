"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ActivityType } from "@/services/activity-service"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"

interface ActivityItem {
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
  activities: ActivityItem[]
}

export function RecentActivity({ activities: initialActivities }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Update activities when initialActivities change
    if (initialActivities && initialActivities.length > 0) {
      setActivities(initialActivities)
    }
  }, [initialActivities])

  const getActivityIcon = (type?: ActivityItem["type"]) => {
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

  const getActivityColor = (type?: ActivityItem["type"]) => {
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
          {loading && activities.length === 0 ? (
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
            </div>
          ) : activities && activities.length > 0 ? (
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
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No recent activities</p>
              <p className="text-xs text-muted-foreground mt-1">Activities will appear here as they occur</p>
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
