"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)

        // Get total count
        const { count: total, error: totalError } = await supabase
          .from("lead_followups")
          .select("*", { count: "exact", head: true })

        if (totalError) throw totalError

        // Get completed count
        const { count: completed, error: completedError } = await supabase
          .from("lead_followups")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")

        if (completedError) throw completedError

        // Get pending count
        const { count: pending, error: pendingError } = await supabase
          .from("lead_followups")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")

        if (pendingError) throw pendingError

        // Get overdue count - followups with scheduled_at before now and status not completed
        const now = new Date().toISOString()
        const { count: overdue, error: overdueError } = await supabase
          .from("lead_followups")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .lt("scheduled_at", now)

        if (overdueError) throw overdueError

        setStats({
          total: total || 0,
          completed: completed || 0,
          pending: pending || 0,
          overdue: overdue || 0,
        })
      } catch (err) {
        console.error("Error fetching follow-up stats:", err)
        setError("Failed to load follow-up statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

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
