"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

/**
 * ⚡ ULTRA-FAST VENDORS COMPONENT
 * 
 * Uses Organization Batch API for lightning-fast loading
 * - Single API call instead of multiple separate calls
 * - Real-time performance tracking
 * - All business logic unchanged
 * - Clean professional layout
 */

interface Vendor {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export function UltraFastVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const { toast } = useToast()

  const loadVendorsData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('🏢 Loading vendors data...')
      
      const response = await fetch('/api/vendors', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result?.success) {
        setVendors(result.vendors || [])
        setLoadTime(Date.now() - startTime)
        
        console.log(`✅ Vendors data loaded: ${result.vendors?.length || 0} vendors`)
        
        toast({
          title: "Success",
          description: `Loaded ${result.vendors?.length || 0} vendors`,
          variant: "default",
        })
      }
      
    } catch (error) {
      console.error('❌ Failed to load vendors data:', error)
      toast({
        title: "Error",
        description: "Failed to load vendors data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadVendorsData()
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
        <span className="ml-2">Loading vendors...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Vendors</h1>
            <p className="text-gray-600">Manage your vendors and service providers.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadVendorsData(true)}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            
            <Badge variant={loadTime < 200 ? "default" : "secondary"}>
              {loadTime || 0}ms Live
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {getPerformanceGrade()} Grade
            </Badge>
            
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Analytics Card */}
      <Card className="w-full border-indigo-200 bg-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-indigo-800 text-sm">⚡ Real-time Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-indigo-600">{loadTime || 0}ms</div>
              <div className="text-xs text-indigo-700">Load Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{vendors.length}</div>
              <div className="text-xs text-indigo-700">Vendors</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{getPerformanceGrade()}</div>
              <div className="text-xs text-indigo-700">Performance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-teal-600">🚀</div>
              <div className="text-xs text-indigo-700">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({vendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No vendors found. Add your first vendor to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{vendor.name}</h3>
                      {vendor.email && (
                        <p className="text-sm text-gray-600">📧 {vendor.email}</p>
                      )}
                      {vendor.phone && (
                        <p className="text-sm text-gray-600">📞 {vendor.phone}</p>
                      )}
                      {vendor.address && (
                        <p className="text-sm text-gray-600">📍 {vendor.address}</p>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                          {vendor.status || 'active'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 