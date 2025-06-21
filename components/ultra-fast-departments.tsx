"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DepartmentList from "@/components/department-list"
import DepartmentForm from "@/components/department-form"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Department } from "@/types/department"

/**
 * ⚡ ULTRA-FAST DEPARTMENTS COMPONENT
 * 
 * Uses People Batch API for lightning-fast loading
 * - Single API call instead of multiple separate calls
 * - Real-time performance tracking
 * - All business logic unchanged
 * - Clean professional layout
 */

interface PeopleData {
  departments: Department[]
  stats: {
    departmentsCount: number
  }
  responseTime?: number
  source?: string
  error?: string
}

export function UltraFastDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const [dataSource, setDataSource] = useState<'loading' | 'database' | 'fallback'>('loading')
  const [activeTab, setActiveTab] = useState("view")
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const { toast } = useToast()

  const loadPeopleData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('🏢 Loading departments data via batch API...')
      
      // 🚀 SINGLE BATCH API CALL instead of multiple calls
      const response = await fetch(`/api/people/batch?sections=departments${isManualRefresh ? '&bustCache=true' : ''}`, {
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
        setDepartments(result.data.departments || [])
        setLoadTime(result.data.responseTime || (Date.now() - startTime))
        setDataSource(result.data.source === 'database' ? 'database' : 'fallback')
        
        console.log(`✅ Departments data loaded: ${result.data.stats?.departmentsCount || 0} departments`)
        
        if (result.data.error) {
          toast({
            title: "Warning",
            description: `Using cached data: ${result.data.error}`,
            variant: "default",
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load departments data:', error)
      setDataSource('fallback')
      toast({
        title: "Error",
        description: "Failed to load departments data",
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

  // 🔥 UNCHANGED BUSINESS LOGIC - All existing functions preserved
  const handleAddDepartment = async (department: Omit<Department, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(department),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add department')
      }

      const result = await response.json()

      if (result.success && result.department) {
        setDepartments([...departments, result.department])
        // Refresh data to get latest counts
        loadPeopleData()
      }

      return { success: true, data: result.department }
    } catch (error: any) {
      console.error("Error adding department:", error)
      
      return {
        success: false,
        error: {
          message: error.message || "Unknown error occurred",
        },
      }
    }
  }

  const handleUpdateDepartment = async (department: Omit<Department, "id" | "created_at" | "updated_at">) => {
    if (!editingDepartment) return { success: false }

    try {
      const response = await fetch('/api/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingDepartment.id,
          ...department
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update department')
      }

      const result = await response.json()

      if (result.success && result.department) {
        setDepartments(
          departments.map((dept) => (dept.id === editingDepartment.id ? result.department : dept)),
        )
      }

      return { success: true, data: result.department }
    } catch (error: any) {
      console.error("Error updating department:", error)
      return {
        success: false,
        error: {
          message: error.message || "Unknown error occurred",
        },
      }
    }
  }

  const handleDeleteDepartment = async (id: number) => {
    try {
      const response = await fetch(`/api/departments?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete department')
      }

      setDepartments(departments.filter((dept) => dept.id !== id))
      return { success: true }
    } catch (error: any) {
      console.error("Error deleting department:", error)
      return { 
        success: false,
        error: {
          message: error.message || "Unknown error occurred"
        }
      }
    }
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setActiveTab("edit")
  }

  const handleCancelEdit = () => {
    setEditingDepartment(null)
    setActiveTab("view")
  }

  const handleAddNew = () => {
    setEditingDepartment(null)
    setActiveTab("add")
  }

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
        <span className="ml-2">Loading departments...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Departments</h1>
            <p className="text-gray-600">Manage departments within your organization.</p>
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
      <Card className="w-full border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-800 text-sm">⚡ Real-time Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-purple-600">{loadTime || 0}ms</div>
              <div className="text-xs text-purple-700">Load Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{departments.length}</div>
              <div className="text-xs text-purple-700">Departments</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{getPerformanceGrade()}</div>
              <div className="text-xs text-purple-700">Performance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">1</div>
              <div className="text-xs text-purple-700">API Calls</div>
            </div>
            <div>
              <div className="text-lg font-bold text-teal-600">
                {dataSource === 'database' ? '🚀' : '⚠️'}
              </div>
              <div className="text-xs text-purple-700">Status</div>
            </div>
            <div>
              <div className="text-lg font-bold text-indigo-600">⚡</div>
              <div className="text-xs text-purple-700">Ultra-Fast</div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="view">View Departments</TabsTrigger>
            <TabsTrigger value="add">Add Department</TabsTrigger>
          </TabsList>

          <TabsContent value="view">
            <DepartmentList
              departments={departments}
              onEditDepartment={handleEditDepartment}
              onAddDepartment={handleAddNew}
              onDeleteDepartment={handleDeleteDepartment}
            />
          </TabsContent>

          <TabsContent value="add">
            <DepartmentForm onSubmit={handleAddDepartment} onCancel={() => setActiveTab("view")} />
          </TabsContent>

          <TabsContent value="edit">
            {editingDepartment && (
              <DepartmentForm
                department={editingDepartment}
                onSubmit={handleUpdateDepartment}
                onCancel={handleCancelEdit}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 