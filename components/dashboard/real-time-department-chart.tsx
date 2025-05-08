"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { getDepartmentDistribution } from "@/actions/department-actions"
import { Button } from "@/components/ui/button"

type DepartmentData = {
  department: string
  count: number
  id?: string | number
}

interface RealTimeDepartmentChartProps {
  initialData: DepartmentData[]
}

export function RealTimeDepartmentChart({ initialData }: RealTimeDepartmentChartProps) {
  const [data, setData] = useState<DepartmentData[]>(
    initialData && initialData.length > 0
      ? initialData
      : [
          { department: "Engineering", count: 24 },
          { department: "Marketing", count: 13 },
          { department: "Sales", count: 18 },
          { department: "Finance", count: 8 },
          { department: "HR", count: 5 },
        ],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Refreshing department data...")

      const freshData = await getDepartmentDistribution().catch((err) => {
        console.error("Error in getDepartmentDistribution:", err)
        throw new Error("Failed to fetch department data")
      })

      console.log("Received fresh department data:", freshData)

      if (freshData && freshData.length > 0) {
        setData(freshData)
        setLastUpdated(new Date())
      } else {
        setError("No department data returned")
        console.error("No department data returned from refresh")
      }
    } catch (error) {
      console.error("Failed to refresh department data:", error)
      setError("Failed to load department data. Using sample data.")
      // Keep using existing data, don't clear it
    } finally {
      setLoading(false)
    }
  }

  // Refresh data on mount and every 30 seconds if autoRefresh is enabled
  useEffect(() => {
    // Initial refresh if no data
    if (!initialData || initialData.length === 0) {
      refreshData()
    }

    let interval: NodeJS.Timeout | null = null

    if (autoRefresh) {
      interval = setInterval(() => {
        refreshData()
      }, 30000) // 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [initialData, autoRefresh])

  // Calculate maximum count for percentage calculations
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`text-xs px-2 py-1 h-auto ${autoRefresh ? "bg-green-50" : ""}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full mr-1 ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
            ></span>
            {autoRefresh ? "Live" : "Paused"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="text-xs h-auto px-2 py-1"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-2 mb-2 text-sm text-amber-800 bg-amber-50 rounded-md border border-amber-200 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-amber-800" />
          {error}
        </div>
      )}

      {data.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No department data available</div>
      ) : (
        data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div>{item.department}</div>
              <div className="font-medium">{item.count}</div>
            </div>
            <div className="rounded-full bg-muted h-2 w-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 ease-in-out"
                style={{ width: `${maxCount ? (item.count / maxCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
