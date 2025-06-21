"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


interface FollowUpStats {
  total: number
  completed: number
  pending: number
  overdue: number
}

export function FollowUpStats() {
  const [stats, setStats] = useState<FollowUpStats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        console.log('📊 Fetching follow-up statistics...')

        // Get all stats in a single optimized query
        const result = await query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'pending' AND scheduled_at < NOW() THEN 1 END) as overdue
          FROM lead_followups
        `)

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch follow-up statistics')
        }

        if (result.data && result.data.length > 0) {
          const statsData = result.data[0]
          setStats({
            total: parseInt(statsData.total) || 0,
            completed: parseInt(statsData.completed) || 0,
            pending: parseInt(statsData.pending) || 0,
            overdue: parseInt(statsData.overdue) || 0,
          })
          
          console.log('✅ Follow-up stats loaded:', {
            total: statsData.total,
            completed: statsData.completed,
            pending: statsData.pending,
            overdue: statsData.overdue
          })
        }
      } catch (err) {
        console.error("❌ Error fetching follow-up stats:", err)
        setError("Failed to load follow-up statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{loading ? "..." : stats.completed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.pending}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{loading ? "..." : stats.overdue}</div>
        </CardContent>
      </Card>
    </div>
  )
}
