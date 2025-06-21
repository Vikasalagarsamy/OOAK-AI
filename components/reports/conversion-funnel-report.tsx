"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsSubmenu } from "@/components/reports/reports-submenu"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign,
  RefreshCw,
  ArrowDown,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
    businessIntelligence: {
      revenueByLeadSource: Array<{source: string, revenue: number, count: number}>
      seasonalTrends: Array<{month: string, quotations: number, revenue: number}>
    }
  }
  stats: {
    totalQuotations: number
    totalLeads: number
    totalRevenue: number
  }
  responseTime?: number
  source?: string
  error?: string
}

export function ConversionFunnelReport() {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("funnel")
  const { toast } = useToast()

  const loadSalesData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    
    try {
      console.log('📊 Loading conversion funnel data...')
      
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
      
      if (result?.data) {
        setSalesData(result.data)
        console.log(`✅ Conversion funnel data loaded: ${result.data.analytics?.conversionFunnel?.totalLeads || 0} leads`)
        
        if (result.data.error) {
          toast({
            title: "Warning",
            description: `Using cached data: ${result.data.error}`,
            variant: "default",
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load conversion funnel data:', error)
      toast({
        title: "Error",
        description: "Failed to load funnel data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadSalesData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadSalesData()
    }, 300000)
    
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading conversion funnel report...</span>
      </div>
    )
  }

  if (!salesData?.analytics) {
    return (
      <div className="space-y-6">
        <ReportsHeader title="Conversion Funnel" />
        <ReportsSubmenu />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No conversion data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { conversionFunnel, revenueMetrics, businessIntelligence } = salesData.analytics

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ReportsHeader title="Conversion Funnel" />
        <Button 
          onClick={() => loadSalesData(true)} 
          variant="outline" 
          size="sm"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      <ReportsSubmenu />

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{conversionFunnel.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Starting point</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{conversionFunnel.overallConversionRate}%</div>
            <p className="text-xs text-muted-foreground">Lead to deal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(revenueMetrics.approvedQuotationValue)}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(revenueMetrics.averageDealSize)}</div>
            <p className="text-xs text-muted-foreground">Per conversion</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline Funnel</CardTitle>
          <CardDescription>Visualize conversion rates between sales stages</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="funnel">🔽 Funnel View</TabsTrigger>
              <TabsTrigger value="stages">📊 By Stage</TabsTrigger>
              <TabsTrigger value="performance">📈 Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="funnel" className="space-y-6">
              <div className="space-y-4">
                {/* Stage 1: Total Leads */}
                <div className="relative">
                  <div className="flex items-center justify-between p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center space-x-4">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Total Leads</h3>
                        <p className="text-sm text-blue-700">Initial interest and inquiries</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">{conversionFunnel.totalLeads}</div>
                      <Badge variant="outline" className="mt-1">100%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-center mt-2">
                    <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>

                {/* Stage 2: Quotations Generated */}
                <div className="relative">
                  <div className="flex items-center justify-between p-6 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                    <div className="flex items-center space-x-4">
                      <Target className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900">Quotations Generated</h3>
                        <p className="text-sm text-purple-700">Leads that received proposals</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600">{conversionFunnel.quotationsGenerated}</div>
                      <Badge variant="outline" className="mt-1">{conversionFunnel.leadToQuotationRate}%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-center mt-2">
                    <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>

                {/* Stage 3: Quotations Sent */}
                <div className="relative">
                  <div className="flex items-center justify-between p-6 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-8 w-8 text-orange-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-orange-900">Quotations Sent</h3>
                        <p className="text-sm text-orange-700">Proposals actively presented</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600">{conversionFunnel.quotationsSent}</div>
                      <Badge variant="outline" className="mt-1">
                        {conversionFunnel.quotationsGenerated > 0 ? 
                          Math.round((conversionFunnel.quotationsSent / conversionFunnel.quotationsGenerated) * 100) : 0
                        }%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-center mt-2">
                    <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>

                {/* Stage 4: Deals Closed */}
                <div className="relative">
                  <div className="flex items-center justify-between p-6 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">Deals Closed</h3>
                        <p className="text-sm text-green-700">Successfully converted customers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">{conversionFunnel.quotationsApproved}</div>
                      <Badge variant="outline" className="mt-1">{conversionFunnel.quotationToApprovalRate}%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stages" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lead to Quotation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Conversion Rate:</span>
                        <span className="font-semibold">{conversionFunnel.leadToQuotationRate}%</span>
                      </div>
                      <Progress value={conversionFunnel.leadToQuotationRate} className="h-3" />
                      <div className="text-sm text-muted-foreground">
                        {conversionFunnel.quotationsGenerated} of {conversionFunnel.totalLeads} leads received quotations
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quotation to Approval</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Conversion Rate:</span>
                        <span className="font-semibold">{conversionFunnel.quotationToApprovalRate}%</span>
                      </div>
                      <Progress value={conversionFunnel.quotationToApprovalRate} className="h-3" />
                      <div className="text-sm text-muted-foreground">
                        {conversionFunnel.quotationsApproved} of {conversionFunnel.quotationsSent} sent quotations approved
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {businessIntelligence.revenueByLeadSource.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Lead Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {businessIntelligence.revenueByLeadSource.map((source, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{source.source}</span>
                            <div className="text-sm text-muted-foreground">{source.count} leads</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(source.revenue)}</div>
                            <div className="text-sm text-muted-foreground">revenue</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {conversionFunnel.overallConversionRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">End-to-end conversion rate</p>
                    <Progress value={conversionFunnel.overallConversionRate} className="mt-3" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {revenueMetrics.revenueConversionRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">Quote to revenue conversion</p>
                    <Progress value={revenueMetrics.revenueConversionRate} className="mt-3" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pipeline Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {formatCurrency(revenueMetrics.projectedRevenue)}
                    </div>
                    <p className="text-sm text-muted-foreground">Potential pipeline value</p>
                  </CardContent>
                </Card>
              </div>

              {businessIntelligence.seasonalTrends && businessIntelligence.seasonalTrends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {businessIntelligence.seasonalTrends.slice(-6).map((trend, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">{trend.month}</span>
                          <div className="flex space-x-6 text-sm">
                            <span>{trend.quotations} quotations</span>
                            <span className="font-semibold">{formatCurrency(trend.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 