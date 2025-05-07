"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getDepartmentDistribution } from "@/actions/department-actions"

type DepartmentData = {
  department: string
  count: number
  id?: string | number
}

export function RealTimeDepartmentChart({ initialData }: { initialData: DepartmentData[] }) {
  const [data, setData] = useState<DepartmentData[]>(
    initialData.length > 0
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

  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Refreshing department data...")
      const freshData = await getDepartmentDistribution()
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
      setError("Failed to load department data")
    } finally {
      setLoading(false)
    }
  }

  // Refresh data on mount and every 30 seconds
  useEffect(() => {
    // Initial refresh if no data
    if (initialData.length === 0) {
      refreshData()
    }

    const interval = setInterval(() => {
      refreshData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [initialData.length])

  // Calculate maximum count for percentage calculations
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
            Live
          </span>
          <button
            onClick={refreshData}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Refresh</span>}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2 mb-2 text-sm text-amber-800 bg-amber-50 rounded-md border border-amber-200">
          {error} - Using sample data
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
