"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { getDepartmentDistribution, validateDepartmentData } from "@/actions/department-actions"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type DepartmentData = {
  department: string
  count: number
}

interface RealTimeDepartmentChartProps {
  initialData?: DepartmentData[]
}

export function RealTimeDepartmentChart({ initialData = [] }: RealTimeDepartmentChartProps) {
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
  const [updatedDepartment, setUpdatedDepartment] = useState<string | null>(null)
  const [dataValid, setDataValid] = useState<boolean | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  // Function to validate data integrity
  const validateData = async () => {
    try {
      const result = await validateDepartmentData()
      setDataValid(result.valid)
      setValidationMessage(result.valid ? "Data validation passed" : result.issues?.[0] || "Unknown validation issue")
    } catch (error) {
      console.error("Error validating data:", error)
      setDataValid(false)
      setValidationMessage("Error during validation")
    }
  }

  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true)
      setError(null)

      const freshData = await getDepartmentDistribution().catch((err) => {
        console.error("Error in getDepartmentDistribution:", err)
        throw new Error("Failed to fetch department data")
      })

      if (freshData && freshData.length > 0) {
        // Check which department changed
        const changedDepts = freshData.filter((dept) => {
          const oldDept = data.find((d) => d.department === dept.department)
          return oldDept && oldDept.count !== dept.count
        })

        if (changedDepts.length > 0) {
          setUpdatedDepartment(changedDepts[0].department)
          setTimeout(() => setUpdatedDepartment(null), 2000)
        }

        setData(freshData)
        setLastUpdated(new Date())

        // Validate data after refresh
        validateData()
      } else {
        setError("No department data returned")
      }
    } catch (error) {
      console.error("Failed to refresh department data:", error)
      setError("Failed to load department data. Using sample data.")
    } finally {
      setLoading(false)
    }
  }

  // Refresh data on mount and every 30 seconds if autoRefresh is enabled
  useEffect(() => {
    // Initial refresh if no data
    if (!initialData || initialData.length === 0) {
      refreshData()
    } else {
      // Validate initial data
      validateData()
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

  // Calculate total employees
  const totalEmployees = data.reduce((sum, dept) => sum + dept.count, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</span>

          {dataValid !== null && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`inline-flex items-center ${dataValid ? "text-green-500" : "text-red-500"}`}>
                    {dataValid ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{validationMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

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

      <div className="text-sm font-medium mb-2">Total Employees: {totalEmployees}</div>

      {data.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No department data available</div>
      ) : (
        data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className={updatedDepartment === item.department ? "text-green-600 font-medium" : ""}>
                {item.department}
                {updatedDepartment === item.department && <span className="ml-1 text-xs animate-pulse">●</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className={`font-medium ${updatedDepartment === item.department ? "text-green-600" : ""}`}>
                  {item.count}
                </div>
                <div className="text-xs text-muted-foreground">
                  {totalEmployees > 0 ? `${Math.round((item.count / totalEmployees) * 100)}%` : "0%"}
                </div>
              </div>
            </div>
            <div className="rounded-full bg-muted h-2 w-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-in-out ${
                  updatedDepartment === item.department ? "bg-green-500" : "bg-primary"
                }`}
                style={{ width: `${maxCount ? (item.count / maxCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
