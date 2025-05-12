"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFollowUpStats, getUpcomingFollowUps } from "@/actions/follow-up-actions"
import type { FollowUpWithLead } from "@/types/follow-up"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"]

export function FollowUpDashboard() {
  const [stats, setStats] = useState<{
    total: number
    completed: number
    scheduled: number
    missed: number
    cancelled: number
    byMethod: Record<string, number>
  } | null>(null)

  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUpWithLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [statsData, upcomingData] = await Promise.all([getFollowUpStats(), getUpcomingFollowUps(7)])

        setStats(statsData)
        setUpcomingFollowUps(upcomingData)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Prepare data for status chart
  const statusData = stats
    ? [
        { name: "Completed", value: stats.completed },
        { name: "Scheduled", value: stats.scheduled },
        { name: "Missed", value: stats.missed },
        { name: "Cancelled", value: stats.cancelled },
      ].filter((item) => item.value > 0)
    : []

  // Prepare data for follow-up type chart
  const methodData = stats
    ? Object.entries(stats.byMethod).map(([method, count]) => ({
        name: method.charAt(0).toUpperCase() + method.slice(1).replace("_", " "),
        value: count,
      }))
    : []

  // Prepare data for weekly distribution chart
  const weekStart = startOfWeek(new Date())
  const weekEnd = endOfWeek(new Date())
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const weeklyData = daysOfWeek.map((day) => {
    const dayName = format(day, "EEE")
    const count = upcomingFollowUps.filter((followUp) => isSameDay(new Date(followUp.scheduled_at), day)).length

    return {
      name: dayName,
      count,
    }
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scheduled || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.missed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Status Distribution</CardTitle>
            <CardDescription>Distribution of follow-ups by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-up Types</CardTitle>
            <CardDescription>Distribution of follow-ups by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {methodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Follow-up Distribution</CardTitle>
          <CardDescription>Number of follow-ups scheduled for each day this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Follow-ups" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
