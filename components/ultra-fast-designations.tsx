"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DesignationList from "@/components/designation-list"
import DesignationForm from "@/components/designation-form"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Designation } from "@/types/designation"
import type { Department } from "@/types/department"

/**
 * ⚡ ULTRA-FAST DESIGNATIONS COMPONENT
 * 
 * Uses People Batch API for lightning-fast loading
 * - Single API call instead of multiple separate calls
 * - Real-time performance tracking
 * - All business logic unchanged
 * - Clean professional layout
 */

interface PeopleData {
  designations: Designation[]
  departments: Department[]
  stats: {
    designationsCount: number
    departmentsCount: number
  }
  responseTime?: number
  source?: string
  error?: string
}

export function UltraFastDesignations() {
  const [designations, setDesignations] = useState<Designation[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const [dataSource, setDataSource] = useState<'loading' | 'database' | 'fallback'>('loading')
  const [activeTab, setActiveTab] = useState("view")
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)
  const { toast } = useToast()

  const loadPeopleData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('🎯 Loading designations data via batch API...')
      
      // 🚀 SINGLE BATCH API CALL instead of multiple calls
      const response = await fetch(`/api/people/batch?sections=designations,departments${isManualRefresh ? '&bustCache=true' : ''}`, {
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
        setDesignations(result.data.designations || [])
        setDepartments(result.data.departments || [])
        setLoadTime(result.data.responseTime || (Date.now() - startTime))
        setDataSource(result.data.source === 'database' ? 'database' : 'fallback')
        
        console.log(`✅ Designations data loaded: ${result.data.stats?.designationsCount || 0} designations`)
        
        if (result.data.error) {
          toast({
            title: "Warning",
            description: `Using cached data: ${result.data.error}`,
            variant: "default",
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load designations data:', error)
      setDataSource('fallback')
      toast({
        title: "Error",
        description: "Failed to load designations data",
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
  const handleAddDesignation = async (designation: Omit<Designation, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch('/api/designations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(designation),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add designation')
      }

      const result = await response.json()

      if (result.success && result.designation) {
        setDesignations([...designations, result.designation])
        // Refresh data to get latest counts
        loadPeopleData()
      }

      return { success: true, data: result.designation }
    } catch (error: any) {
      console.error("Error adding designation:", error)
      
      return {
        success: false,
        error: {
          message: error.message || "Unknown error occurred",
        },
      }
    }
  }

  const handleUpdateDesignation = async (designation: Omit<Designation, "id" | "created_at" | "updated_at">) => {
    if (!editingDesignation) return { success: false }

    try {
      const response = await fetch('/api/designations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingDesignation.id,
          ...designation
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update designation')
      }

      const result = await response.json()

      if (result.success && result.designation) {
        setDesignations(
          designations.map((desig) => (desig.id === editingDesignation.id ? result.designation : desig)),
        )
      }

      return { success: true, data: result.designation }
    } catch (error: any) {
      console.error("Error updating designation:", error)
      return {
        success: false,
        error: {
          message: error.message || "Unknown error occurred",
        },
      }
    }
  }

  const handleDeleteDesignation = async (id: number) => {
    try {
      const response = await fetch(`/api/designations?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete designation')
      }

      setDesignations(designations.filter((desig) => desig.id !== id))
      return { success: true }
    } catch (error: any) {
      console.error("Error deleting designation:", error)
      return { 
        success: false,
        error: {
          message: error.message || "Unknown error occurred"
        }
      }
    }
  }

  const handleEditDesignation = (designation: Designation) => {
    setEditingDesignation(designation)
    setActiveTab("edit")
  }

  const handleCancelEdit = () => {
    setEditingDesignation(null)
    setActiveTab("view")
  }

  const handleAddNew = () => {
    setEditingDesignation(null)
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
        <span className="ml-2">Loading designations...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Designations</h1>
            <p className="text-gray-600">Manage job designations within your organization.</p>
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
      <Card className="w-full border-indigo-200 bg-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-indigo-800 text-sm">⚡ Real-time Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-indigo-600">{loadTime || 0}ms</div>
              <div className="text-xs text-indigo-700">Load Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{designations.length}</div>
              <div className="text-xs text-indigo-700">Designations</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{departments.length}</div>
              <div className="text-xs text-indigo-700">Departments</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{getPerformanceGrade()}</div>
              <div className="text-xs text-indigo-700">Performance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">1</div>
              <div className="text-xs text-indigo-700">API Calls</div>
            </div>
            <div>
              <div className="text-lg font-bold text-teal-600">⚡</div>
              <div className="text-xs text-indigo-700">Ultra-Fast</div>
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
            <TabsTrigger value="view">View Designations</TabsTrigger>
            <TabsTrigger value="add">Add Designation</TabsTrigger>
          </TabsList>

          <TabsContent value="view">
            <DesignationList
              designations={designations}
              departments={departments}
              onEditDesignation={handleEditDesignation}
              onAddDesignation={handleAddNew}
              onDeleteDesignation={handleDeleteDesignation}
            />
          </TabsContent>

          <TabsContent value="add">
            <DesignationForm
              departments={departments}
              onSubmit={handleAddDesignation}
              onCancel={() => setActiveTab("view")}
            />
          </TabsContent>

          <TabsContent value="edit">
            {editingDesignation && (
              <DesignationForm
                designation={editingDesignation}
                departments={departments}
                onSubmit={handleUpdateDesignation}
                onCancel={handleCancelEdit}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 