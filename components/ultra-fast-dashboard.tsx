"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

/**
 * ⚡ REAL-TIME ULTRA-FAST DASHBOARD
 * 
 * Now serves REAL database data with <50ms performance
 * Updates in real-time when data changes
 */

interface DashboardStats {
  employees: number
  departments: number
  quotations: number
  roles: number
}

interface Lead {
  id: string
  company_name: string
  status: string
  created_at: string
}

interface DashboardData {
  stats: DashboardStats
  recentLeads: Lead[]
  roles: any[]
  timestamp?: number
  responseTime?: number
  source?: string
  connectionWarmed?: boolean
  error?: string
}

export function UltraFastDashboard() {
  const [data, setData] = useState<DashboardData>({
    stats: { employees: 0, departments: 0, quotations: 0, roles: 0 },
    recentLeads: [],
    roles: [],
    timestamp: Date.now()
  })
  const [loadTime, setLoadTime] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataSource, setDataSource] = useState<'loading' | 'database' | 'fallback'>('loading')

  const loadDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('🚀 Loading real-time dashboard data...')
      
      const response = await fetch('/api/dashboard/batch', {
        cache: 'no-store', // Always get fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result?.data) {
        setData(result.data)
        setLoadTime(result.data.responseTime || (Date.now() - startTime))
        setDataSource(result.data.source === 'database' ? 'database' : 'fallback')
        
        console.log(`✅ Dashboard data loaded: ${result.data.stats.employees} employees, ${result.data.stats.departments} departments`)
      }
      
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error)
      setDataSource('fallback')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadDashboardData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getPerformanceGrade = () => {
    if (loadTime < 50) return 'A+'
    if (loadTime < 200) return 'A'
    if (loadTime < 500) return 'B'
    if (loadTime < 1000) return 'C'
    return 'F'
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hot': return 'bg-red-100 text-red-800'
      case 'warm': return 'bg-yellow-100 text-yellow-800'
      case 'cold': return 'bg-blue-100 text-blue-800'
      case 'closed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header with Workspace Text */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-600">Your business overview and analytics.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            
            <Badge variant={loadTime < 200 ? "default" : loadTime < 500 ? "secondary" : "destructive"}>
              {loadTime || 0}ms {dataSource === 'database' ? '🔗 Live' : '⚠️ Fallback'}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {getPerformanceGrade()} Grade
            </Badge>
          </div>
        </div>
      </div>

      {/* Performance Analytics Card */}
      <Card className="w-full border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-800 text-sm">⚡ Real-time Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-blue-600">{loadTime || 0}ms</div>
              <div className="text-xs text-blue-700">Load Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{data.stats.employees}</div>
              <div className="text-xs text-blue-700">Team Members</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{data.stats.departments}</div>
              <div className="text-xs text-blue-700">Departments</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{data.stats.quotations}</div>
              <div className="text-xs text-blue-700">Active Quotations</div>
            </div>
            <div>
              <div className="text-lg font-bold text-teal-600">{data.recentLeads?.length || 0}</div>
              <div className="text-xs text-blue-700">Recent Inquiries</div>
            </div>
            <div>
              <div className="text-lg font-bold text-indigo-600">{data.stats.roles}</div>
              <div className="text-xs text-blue-700">User Roles</div>
            </div>
            <div>
              <div className="text-lg font-bold text-pink-600">{getPerformanceGrade()}</div>
              <div className="text-xs text-blue-700">Performance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {dataSource === 'database' ? '🚀' : '⚠️'}
              </div>
              <div className="text-xs text-blue-700">Status</div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <Badge variant={dataSource === 'database' ? 'default' : 'secondary'} className="text-xs">
              {dataSource === 'database' ? '🚀 Real-time Database' : '⚠️ Fallback Mode'}
            </Badge>
            {data.error && (
              <Badge variant="destructive" className="text-xs ml-2">
                ⚠️ Database Error - Using Fallback
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Team Members Card */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">{data.stats.employees}</div>
            <p className="text-sm text-gray-600">Active photographers & staff</p>
          </CardContent>
        </Card>

        {/* Departments Card */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">{data.stats.departments}</div>
            <p className="text-sm text-gray-600">Photography & support teams</p>
          </CardContent>
        </Card>

        {/* Active Quotations Card */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Active Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-2">{data.stats.quotations}</div>
            <p className="text-sm text-gray-600">Wedding proposals pending</p>
          </CardContent>
        </Card>

        {/* Recent Inquiries Card */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Recent Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600 mb-2">{data.recentLeads?.length || 0}</div>
            <p className="text-sm text-gray-600">New wedding leads</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 