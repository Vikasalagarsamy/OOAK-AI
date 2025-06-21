"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { EmployeeList } from "@/components/employee-list"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

/**
 * ⚡ ULTRA-FAST EMPLOYEES COMPONENT
 * 
 * Uses People Batch API for lightning-fast loading
 * - Single API call instead of multiple separate calls
 * - Real-time performance tracking
 * - All business logic unchanged
 * - Clean professional layout
 */

interface Employee {
  id: number
  employee_id?: string
  first_name?: string
  last_name?: string
  email?: string
  job_title?: string
  status?: string
  department_name?: string
  designation_name?: string
  primary_company_name?: string
  home_branch_name?: string
  created_at?: string
  [key: string]: any
}

interface PeopleData {
  employees: Employee[]
  stats: {
    employeesCount: number
  }
  responseTime?: number
  source?: string
  error?: string
}

export function UltraFastEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const [dataSource, setDataSource] = useState<'loading' | 'database' | 'fallback'>('loading')
  const { toast } = useToast()

  const loadPeopleData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('👥 Loading employees data via batch API...')
      
      // 🚀 SINGLE BATCH API CALL instead of multiple calls
      const response = await fetch(`/api/people/batch?sections=employees${isManualRefresh ? '&bustCache=true' : ''}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result?.data) {
        setEmployees(result.data.employees || [])
        setLoadTime(result.data.responseTime || (Date.now() - startTime))
        setDataSource(result.data.source === 'database' ? 'database' : 'fallback')
        
        console.log(`✅ Employees data loaded: ${result.data.stats?.employeesCount || 0} employees`)
        
        if (result.data.error) {
          toast({
            title: "Warning",
            description: `Using cached data: ${result.data.error}`,
            variant: "default",
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load employees data:', error)
      setDataSource('fallback')
      toast({
        title: "Error",
        description: "Failed to load employees data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadPeopleData()
    
    // Auto-refresh every 2 minutes for real-time updates
    const interval = setInterval(() => {
      loadPeopleData()
    }, 120000)
    
    return () => clearInterval(interval)
  }, [])

  const getPerformanceGrade = () => {
    if (loadTime < 50) return 'A+'
    if (loadTime < 200) return 'A'
    if (loadTime < 500) return 'B'
    if (loadTime < 1000) return 'C'
    return 'F'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading employees...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Employees</h1>
            <p className="text-gray-600">Manage your organization's employees, their roles, and company allocations.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPeopleData(true)}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            
            <Badge variant={loadTime < 200 ? "default" : loadTime < 500 ? "secondary" : "destructive"}>
              {loadTime || 0}ms {dataSource === 'database' ? '🔗 Live' : '⚠️ Cached'}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {getPerformanceGrade()} Grade
            </Badge>
          </div>
        </div>
      </div>

      {/* Performance Analytics Card */}
      <Card className="w-full border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-800 text-sm">⚡ Real-time Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-green-600">{loadTime || 0}ms</div>
              <div className="text-xs text-green-700">Load Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{employees.length}</div>
              <div className="text-xs text-green-700">Employees</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{getPerformanceGrade()}</div>
              <div className="text-xs text-green-700">Performance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">1</div>
              <div className="text-xs text-green-700">API Calls</div>
            </div>
            <div>
              <div className="text-lg font-bold text-teal-600">
                {dataSource === 'database' ? '🚀' : '⚠️'}
              </div>
              <div className="text-xs text-green-700">Status</div>
            </div>
            <div>
              <div className="text-lg font-bold text-indigo-600">⚡</div>
              <div className="text-xs text-green-700">Ultra-Fast</div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <Badge variant={dataSource === 'database' ? 'default' : 'secondary'} className="text-xs">
              {dataSource === 'database' ? '🚀 Real-time Database' : '⚠️ Cached Data'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - UNCHANGED BUSINESS LOGIC */}
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        {/* Pass the existing EmployeeList component - ALL FUNCTIONALITY PRESERVED */}
        <EmployeeList employees={employees} />
      </div>
    </div>
  )
} 