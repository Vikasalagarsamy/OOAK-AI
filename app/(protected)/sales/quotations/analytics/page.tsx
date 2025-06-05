"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  RefreshCw
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getQuotationAnalytics } from "@/actions/quotations-actions"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Types for analytics data
interface AnalyticsData {
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

export default function QuotationAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("12months")

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const result = await getQuotationAnalytics()
      if (result.success && result.analytics) {
        setAnalytics(result.analytics)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load analytics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  const getInsightIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return <TrendingUp className="h-4 w-4 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground mb-4">Unable to load analytics data</p>
          <Button onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">💰 Sales Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">Transform your quotation data into actionable business insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

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

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Conversion Funnel
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Business Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Conversion Funnel Visualization */}
          <Card>
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
              <div className="space-y-6">
                {/* Funnel Steps */}
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

                {/* Performance Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analytics.conversionFunnel.leadToQuotationRate}%
                    </div>
                    <p className="text-sm text-gray-600">Lead → Quote Rate</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Industry avg: 20-30%
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {analytics.conversionFunnel.quotationToApprovalRate}%
                    </div>
                    <p className="text-sm text-gray-600">Quote → Close Rate</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Industry avg: 15-25%
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analytics.conversionFunnel.overallConversionRate}%
                    </div>
                    <p className="text-sm text-gray-600">Overall Conversion</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Industry avg: 5-15%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top Performing Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 capitalize mb-2">
                    {analytics.performanceInsights.topPerformingPackage}
                  </div>
                  <p className="text-muted-foreground">
                    Your highest converting package
                  </p>
                  <Badge variant="outline" className="mt-3 border-yellow-500 text-yellow-700">
                    Best Performer
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 capitalize mb-2">
                    {analytics.performanceInsights.mostRejectedPackage}
                  </div>
                  <p className="text-muted-foreground">
                    Package with highest rejection rate
                  </p>
                  <Badge variant="destructive" className="mt-3">
                    Requires Review
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          {/* Detailed Conversion Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Breakdown</CardTitle>
              <CardDescription>
                Analyze each stage of your sales funnel for optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Lead Sources Performance */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Revenue by Lead Source</h4>
                  <div className="space-y-3">
                    {analytics.businessIntelligence.revenueByLeadSource.map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-green-500' : 
                            index === 1 ? 'bg-blue-500' : 
                            index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium">{source.source}</p>
                            <p className="text-sm text-gray-600">{source.count} leads</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(source.revenue)}</p>
                          <p className="text-sm text-gray-500">
                            {source.count > 0 ? formatCurrency(source.revenue / source.count) : formatCurrency(0)} avg
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Package Preferences */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Package Performance</h4>
                  <div className="grid gap-4">
                    {analytics.businessIntelligence.packagePreferences.map((pkg, index) => (
                      <div key={pkg.package} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "outline"} className="capitalize">
                            {pkg.package}
                          </Badge>
                          <div>
                            <p className="font-medium">{pkg.count} quotations</p>
                            <p className="text-sm text-gray-600">Total revenue: {formatCurrency(pkg.revenue)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(pkg.revenue / Math.max(pkg.count, 1))}</p>
                          <p className="text-sm text-gray-500">Avg value</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Quoted</span>
                  <span className="font-bold">{formatCurrency(analytics.revenueMetrics.totalQuotationValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue Earned</span>
                  <span className="font-bold text-green-600">{formatCurrency(analytics.revenueMetrics.approvedQuotationValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pipeline Value</span>
                  <span className="font-bold text-blue-600">{formatCurrency(analytics.revenueMetrics.projectedRevenue)}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="font-bold text-purple-600">{analytics.revenueMetrics.revenueConversionRate}%</span>
                  </div>
                  <Progress value={analytics.revenueMetrics.revenueConversionRate} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Sales Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${getPerformanceColor(analytics.performanceInsights.averageTimeToQuotation, 'days')}`}>
                      {analytics.performanceInsights.averageTimeToQuotation} days
                    </div>
                    <p className="text-sm text-gray-600">Average time to generate quotation</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${getPerformanceColor(analytics.performanceInsights.averageTimeToApproval, 'days')}`}>
                      {analytics.performanceInsights.averageTimeToApproval} days
                    </div>
                    <p className="text-sm text-gray-600">Average time to close deal</p>
                  </div>
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Deal Size</p>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics.revenueMetrics.averageDealSize)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seasonal Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Revenue Trends (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.performanceInsights.seasonalTrends.map((trend, index) => (
                  <div key={trend.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-16">{trend.month}</span>
                      <Badge variant="outline">{trend.quotations} quotes</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-green-600">{formatCurrency(trend.revenue)}</span>
                      {index > 0 && analytics.performanceInsights.seasonalTrends[index - 1] && (
                        <div className="flex items-center">
                          {getInsightIcon(trend.revenue - analytics.performanceInsights.seasonalTrends[index - 1].revenue)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Rejection Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Lost Deal Analysis
              </CardTitle>
              <CardDescription>
                Understand why quotations are rejected to improve your success rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.businessIntelligence.rejectionReasons.map((reason, index) => (
                  <div key={reason.reason} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div>
                      <p className="font-medium text-red-900">{reason.reason}</p>
                      <p className="text-sm text-red-700">{reason.count} quotations affected</p>
                    </div>
                    <Badge variant="destructive">{reason.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.businessIntelligence.teamPerformance.map((member) => (
                  <div key={member.member} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.member}</p>
                      <p className="text-sm text-gray-600">
                        {member.quotations} quotations • {member.approvals} approvals
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(member.revenue)}</p>
                      <p className="text-sm text-gray-500">
                        {member.quotations > 0 ? Math.round((member.approvals / member.quotations) * 100) : 0}% conversion
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Zap className="h-5 w-5" />
                🎯 Strategic Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.conversionFunnel.overallConversionRate < 10 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-900">Low Overall Conversion Rate</p>
                      <p className="text-sm text-orange-700">
                        Focus on lead qualification and quotation follow-up process
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
                        Consider streamlining your approval process and improving follow-up cadence
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
                        Review pricing strategy and competitor analysis to improve win rate
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 