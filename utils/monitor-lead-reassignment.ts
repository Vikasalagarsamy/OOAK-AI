import { createClient } from "@/lib/supabase/server"

/**
 * Utility to monitor lead reassignment performance
 */
export async function getReassignmentMetrics(startDate?: string, endDate?: string) {
  const supabase = createClient()
  const now = new Date()
  const defaultStartDate = new Date(now.setDate(now.getDate() - 30)).toISOString()

  const start = startDate || defaultStartDate
  const end = endDate || new Date().toISOString()

  try {
    // Get count of reassignments by day
    const { data: dailyReassignments, error: dailyError } = await supabase.rpc("get_daily_reassignments", {
      start_date: start,
      end_date: end,
    })

    // Get average processing time for reassignments
    const { data: avgProcessingTime, error: avgTimeError } = await supabase.rpc(
      "get_avg_reassignment_processing_time",
      { start_date: start, end_date: end },
    )

    // Get reassignment counts by reason
    const { data: reasonCounts, error: reasonError } = await supabase.rpc("get_reassignment_reason_counts", {
      start_date: start,
      end_date: end,
    })

    // Get error counts
    const { data: errorCounts, error: errorCountError } = await supabase
      .from("activities")
      .select("count")
      .eq("action_type", "error")
      .gte("created_at", start)
      .lte("created_at", end)
      .ilike("description", "%auto_reassign_leads%")
      .single()

    return {
      dailyReassignments: dailyReassignments || [],
      avgProcessingTime: avgProcessingTime || { avg_ms: 0 },
      reasonCounts: reasonCounts || [],
      errorCount: errorCounts?.count || 0,
      errors: [dailyError, avgTimeError, reasonError, errorCountError].filter(Boolean).map((e) => e.message),
    }
  } catch (error) {
    return {
      dailyReassignments: [],
      avgProcessingTime: { avg_ms: 0 },
      reasonCounts: [],
      errorCount: 0,
      errors: [`Failed to fetch metrics: ${error.message}`],
    }
  }
}
