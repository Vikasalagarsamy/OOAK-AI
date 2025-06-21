"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Supplier {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export function UltraFastSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const { toast } = useToast()

  const loadSuppliersData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('🏢 Loading suppliers data...')
      
      const response = await fetch('/api/suppliers', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result?.success) {
        setSuppliers(result.suppliers || [])
        setLoadTime(Date.now() - startTime)
        
        console.log(`✅ Suppliers data loaded: ${result.suppliers?.length || 0} suppliers`)
        
        toast({
          title: "Success",
          description: `Loaded ${result.suppliers?.length || 0} suppliers`,
          variant: "default",
        })
      }
      
    } catch (error) {
      console.error('❌ Failed to load suppliers data:', error)
      toast({
        title: "Error",
        description: "Failed to load suppliers data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadSuppliersData()
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
        <span className="ml-2">Loading suppliers...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Suppliers</h1>
            <p className="text-gray-600">Manage your suppliers and vendor relationships.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSuppliersData(true)}
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
              <span>Add Supplier</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Analytics Card */}
      <Card className="w-full border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-800 text-sm">⚡ Real-time Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-purple-600">{loadTime || 0}ms</div>
              <div className="text-xs text-purple-700">Load Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{suppliers.length}</div>
              <div className="text-xs text-purple-700">Suppliers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{getPerformanceGrade()}</div>
              <div className="text-xs text-purple-700">Performance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-teal-600">🚀</div>
              <div className="text-xs text-purple-700">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({suppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No suppliers found. Add your first supplier to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      {supplier.email && (
                        <p className="text-sm text-gray-600">📧 {supplier.email}</p>
                      )}
                      {supplier.phone && (
                        <p className="text-sm text-gray-600">📞 {supplier.phone}</p>
                      )}
                      {supplier.address && (
                        <p className="text-sm text-gray-600">📍 {supplier.address}</p>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                          {supplier.status || 'active'}
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