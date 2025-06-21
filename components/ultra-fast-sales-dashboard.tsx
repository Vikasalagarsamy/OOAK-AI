"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Users, 
  Clock, 
  AlertTriangle, 
  Trophy,
  Zap,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  RefreshCw,
  Plus,
  FileText,
  PhoneCall,
  UserPlus,
  ListChecks,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Loader2 } from "lucide-react"

/**
 * ⚡ ULTRA-FAST SALES DASHBOARD COMPONENT
 * 
 * Uses Sales Batch API for lightning-fast loading
 * - Single API call instead of 2+ separate calls
 * - Real-time performance tracking
 * - ALL business intelligence preserved
 * - ALL functionality unchanged
 * - Clean professional layout
 */

interface SalesData {
  analytics: {
    conversionFunnel: {
      totalLeads: number
      quotationsGenerated: number
      quotationsSent: number
      quotationsApproved: number
      leadToQuotationRate: number
      quotationToApprovalRate: number
      overallConversionRate: number
    }
    revenueMetrics: {
      totalQuotationValue: number
      approvedQuotationValue: number
      averageDealSize: number
      projectedRevenue: number
      revenueConversionRate: number
    }
    performanceInsights: {
      averageTimeToQuotation: number
      averageTimeToApproval: number
      topPerformingPackage: string
      mostRejectedPackage: string
      seasonalTrends: Array<{month: string, quotations: number, revenue: number}>
    }
    businessIntelligence: {
      revenueByLeadSource: Array<{source: string, revenue: number, count: number}>
      packagePreferences: Array<{package: string, count: number, revenue: number}>
      rejectionReasons: Array<{reason: string, count: number}>
      teamPerformance: Array<{member: string, quotations: number, approvals: number, revenue: number}>
    }
  }
  quotationCounts: Record<string, number>
  stats: {
    totalQuotations: number
    totalLeads: number
    totalRevenue: number
  }
  responseTime?: number
  source?: string
  error?: string
}

export function UltraFastSalesDashboard() {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)
  const [dataSource, setDataSource] = useState<'loading' | 'database' | 'fallback'>('loading')
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  const loadSalesData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    const startTime = Date.now()
    
    try {
      console.log('💰 Loading sales dashboard data via batch API...')
      
      // 🚀 SINGLE BATCH API CALL instead of 2+ separate calls
      const response = await fetch(`/api/sales/batch?sections=analytics,counts&bustCache=true&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Debug logs removed - issue resolved ✅
      
      if (result?.data) {
        setSalesData(result.data)
        setLoadTime(result.data.responseTime || (Date.now() - startTime))
        setDataSource(result.data.source === 'database' ? 'database' : 'fallback')
        
        console.log(`✅ Sales dashboard data loaded: ${result.data.stats?.totalQuotations || 0} quotations, ${result.data.stats?.totalLeads || 0} leads, ₹${result.data.stats?.totalRevenue || 0} revenue`)
        
        if (result.data.error) {
          toast({
            title: "Warning",
            description: `Using cached data: ${result.data.error}`,
            variant: "default",
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load sales data:', error)
      setDataSource('fallback')
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadSalesData()
    
    // Auto-refresh every 2 minutes for real-time updates
    const interval = setInterval(() => {
      loadSalesData()
    }, 120000)
    
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPerformanceColor = (value: number, type: 'percentage' | 'days') => {
    if (type === 'percentage') {
      if (value >= 75) return 'text-green-600'
      if (value >= 50) return 'text-yellow-600'
      return 'text-red-600'
    } else {
      if (value <= 7) return 'text-green-600'
      if (value <= 14) return 'text-yellow-600'
      return 'text-red-600'
    }
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
        <span className="ml-2">Loading sales dashboard...</span>
      </div>
    )
  }

  // Debug code removed - dashboard now working perfectly ✅

  if (!salesData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No sales data available</p>
        <Button onClick={() => loadSalesData(true)} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const { analytics, quotationCounts } = salesData

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">📊 Sales Dashboard</h1>
            <p className="text-muted-foreground mt-2">Complete overview of your sales performance and key metrics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/sales/quotations/analytics">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Advanced Analytics
              </Button>
            </Link>
            <Link href="/sales/quotations/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Quotation
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSalesData(true)}
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
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-800 text-sm">⚡ Real-time Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-orange-600">{loadTime || 0}ms</div>
              <div className="text-xs text-orange-700">Load Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{salesData.stats.totalQuotations}</div>
              <div className="text-xs text-orange-700">Quotations</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{salesData.stats.totalLeads}</div>
              <div className="text-xs text-orange-700">Leads</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{analytics.conversionFunnel.overallConversionRate}%</div>
              <div className="text-xs text-orange-700">Conversion</div>
            </div>
            <div>
              <div className="text-lg font-bold text-teal-600">1</div>
              <div className="text-xs text-orange-700">API Calls</div>
            </div>
            <div>
              <div className="text-lg font-bold text-indigo-600">{getPerformanceGrade()}</div>
              <div className="text-xs text-orange-700">Performance</div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <Badge variant={dataSource === 'database' ? 'default' : 'secondary'} className="text-xs">
              {dataSource === 'database' ? '🚀 Real-time Database' : '⚠️ Cached Data'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <Link href="/sales/create-lead">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <UserPlus className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Create Lead</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/my-leads">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <ListChecks className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">My Leads</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/follow-up">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <PhoneCall className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">Follow Up</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/quotations">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">Quotations</p>
                {Object.values(quotationCounts).reduce((sum, count) => sum + count, 0) > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    {Object.values(quotationCounts).reduce((sum, count) => sum + count, 0)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/order-confirmation">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Orders</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales/rejected-leads">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-sm font-medium">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {analytics ? (
        <>
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.conversionFunnel.overallConversionRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.conversionFunnel.quotationsApproved} of {analytics.conversionFunnel.totalLeads} leads converted
                </p>
                <Progress 
                  value={analytics.conversionFunnel.overallConversionRate} 
                  className="mt-3"
                />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.revenueMetrics.approvedQuotationValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.revenueMetrics.revenueConversionRate}% of quoted value
                </p>
                <Progress 
                  value={analytics.revenueMetrics.revenueConversionRate} 
                  className="mt-3"
                />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(analytics.revenueMetrics.projectedRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Potential revenue in pipeline
                </p>
                <div className="mt-3 text-sm">
                  <span className="text-green-600 font-medium">
                    Avg Deal: {formatCurrency(analytics.revenueMetrics.averageDealSize)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(analytics.performanceInsights.averageTimeToApproval, 'days')}`}>
                  {analytics.performanceInsights.averageTimeToApproval} days
                </div>
                <p className="text-xs text-muted-foreground">
                  Average time to close deals
                </p>
                <div className="mt-3 text-sm">
                  <span className="text-gray-600">
                    Quote: {analytics.performanceInsights.averageTimeToQuotation} days
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel Visualization */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Sales Conversion Funnel
              </CardTitle>
              <CardDescription>
                Track your lead-to-customer journey and identify optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div>
                    <h4 className="font-semibold text-blue-900">Total Leads</h4>
                    <p className="text-sm text-blue-700">Starting point of your sales process</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.conversionFunnel.totalLeads}
                    </div>
                    <div className="text-sm text-blue-500">100%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div>
                    <h4 className="font-semibold text-purple-900">Quotations Generated</h4>
                    <p className="text-sm text-purple-700">Leads that received proposals</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.conversionFunnel.quotationsGenerated}
                    </div>
                    <div className="text-sm text-purple-500">
                      {analytics.conversionFunnel.leadToQuotationRate}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <div>
                    <h4 className="font-semibold text-orange-900">Quotations Sent</h4>
                    <p className="text-sm text-orange-700">Proposals actively presented to clients</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics.conversionFunnel.quotationsSent}
                    </div>
                    <div className="text-sm text-orange-500">
                      {analytics.conversionFunnel.quotationsGenerated > 0 ? 
                        Math.round((analytics.conversionFunnel.quotationsSent / analytics.conversionFunnel.quotationsGenerated) * 100) : 0
                      }%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div>
                    <h4 className="font-semibold text-green-900">Deals Closed</h4>
                    <p className="text-sm text-green-700">Successfully converted customers</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.conversionFunnel.quotationsApproved}
                    </div>
                    <div className="text-sm text-green-500">
                      {analytics.conversionFunnel.quotationToApprovalRate}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Performance and Action Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Package Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 capitalize mb-2">
                    {analytics.performanceInsights.topPerformingPackage}
                  </div>
                  <p className="text-yellow-700 text-sm mb-2">Your highest converting package</p>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    Best Performer
                  </Badge>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 capitalize mb-2">
                    {analytics.performanceInsights.mostRejectedPackage}
                  </div>
                  <p className="text-red-700 text-sm mb-2">Package needing attention</p>
                  <Badge variant="destructive">
                    Requires Review
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Zap className="h-5 w-5" />
                  🎯 Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.conversionFunnel.overallConversionRate < 10 && (
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Low Conversion Rate</p>
                        <p className="text-sm text-orange-700">
                          Focus on lead qualification and follow-up
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {analytics.performanceInsights.averageTimeToApproval > 14 && (
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                      <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Slow Sales Cycle</p>
                        <p className="text-sm text-orange-700">
                          Streamline approval process
                        </p>
                      </div>
                    </div>
                  )}

                  {analytics.revenueMetrics.revenueConversionRate < 50 && (
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                      <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Revenue Leakage</p>
                        <p className="text-sm text-orange-700">
                          Review pricing and competitor analysis
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <Link href="/sales/quotations/analytics">
                      <Button variant="outline" size="sm" className="text-orange-700 border-orange-300">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Detailed Analytics
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* No Analytics Data */
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating leads and quotations to see your sales performance
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/sales/create-lead">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create First Lead
                </Button>
              </Link>
              <Button onClick={() => loadSalesData(true)} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 