"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon, TrendingUpIcon } from "lucide-react"
import { getFollowUps } from "@/actions/follow-up-actions"
import type { FollowUpWithLead } from "@/types/follow-up"
import { isPast, isToday, isThisWeek } from "date-fns"

interface Stats {
  total: number
  overdue: number
  today: number
  thisWeek: number
  upcoming: number
  completed: number
  completionRate: number
}

export function FollowUpStats() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    overdue: 0,
    today: 0,
    thisWeek: 0,
    upcoming: 0,
    completed: 0,
    completionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const followUps = await getFollowUps()
        
        const total = followUps.length
        const overdue = followUps.filter(f => 
          isPast(new Date(f.scheduled_at)) && 
          ["scheduled", "in_progress"].includes(f.status)
        ).length
        
        const today = followUps.filter(f => 
          isToday(new Date(f.scheduled_at)) && 
          ["scheduled", "in_progress"].includes(f.status)
        ).length
        
        const thisWeek = followUps.filter(f => 
          isThisWeek(new Date(f.scheduled_at)) && 
          ["scheduled", "in_progress"].includes(f.status)
        ).length
        
        const upcoming = followUps.filter(f => 
          !isPast(new Date(f.scheduled_at)) && 
          ["scheduled", "in_progress", "rescheduled"].includes(f.status)
        ).length
        
        const completed = followUps.filter(f => f.status === "completed").length
        
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

        setStats({
          total,
          overdue,
          today,
          thisWeek,
          upcoming,
          completed,
          completionRate,
        })
      } catch (error) {
        console.error("Error loading follow-up stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Follow-ups</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
          <p className="text-xs text-red-600">Needs immediate attention</p>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Today</CardTitle>
          <ClockIcon className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">{stats.today}</div>
          <p className="text-xs text-blue-600">Scheduled for today</p>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">This Week</CardTitle>
          <CalendarIcon className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700">{stats.thisWeek}</div>
          <p className="text-xs text-purple-600">Due this week</p>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">Upcoming</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{stats.upcoming}</div>
          <p className="text-xs text-green-600">Future follow-ups</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completionRate}% completion rate
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 