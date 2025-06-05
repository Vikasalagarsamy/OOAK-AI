"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Calendar,
  Lightbulb,
  BarChart3,
  Activity,
  Zap,
  Star,
  Award,
  MessageCircleQuestion,
  UserCheck,
  TrendingDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from 'date-fns'

interface AIPrediction {
  quotation_id: number
  success_probability: number
  confidence_score: number
  prediction_factors: any
}

interface AIRecommendation {
  id: number
  recommendation_type: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  title: string
  description: string
  suggested_action: string
  confidence_score: number
  expected_impact: any
  reasoning: string
}

interface RevenueForecast {
  predicted_revenue: number
  confidence_interval_low: number
  confidence_interval_high: number
  period_start: string
  period_end: string
}

interface SalesTeamMember {
  employee_id: string
  full_name: string
  email: string
  role: string
  territory: string
  target_monthly: number
}

interface PerformanceMetric {
  employee_id: string
  quotations_created: number
  quotations_converted: number
  total_revenue_generated: number
  conversion_rate: number
  activity_score: number
  performance_score: number
  metric_period: string
}

interface ManagementInsight {
  id: number
  insight_type: string
  employee_id?: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  title: string
  description: string
  key_metrics: any
  suggested_questions: string[]
  recommended_actions: string[]
  confidence_score: number
}

interface TeamPerformanceData {
  team_overview: any
  individual_performance: PerformanceMetric[]
  management_insights: ManagementInsight[]
  team_members: SalesTeamMember[]
}

export function AIInsightsDashboard() {
  const [predictions, setPredictions] = useState<AIPrediction[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [forecasts, setForecasts] = useState<RevenueForecast[]>([])
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Only run once on mount to prevent infinite loops
  useEffect(() => {
    loadAIInsights()
  }, []) // Empty dependency array to run only once

  // Memoize tab change handler to prevent infinite re-renders
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  const loadAIInsights = async () => {
    if (isLoading) return // Prevent multiple concurrent calls
    
    setIsLoading(true)
    try {
      // Load forecasts
      const forecastResponse = await fetch('/api/ai-insights/forecasts')
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        setForecasts(forecastData.forecasts || [])
      }

      // Load team performance
      const teamResponse = await fetch('/api/ai-insights/team-performance')
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        console.log('📊 Team performance data received:', teamData)
        console.log('🔍 Management insights:', teamData.data?.management_insights)
        setTeamPerformance(teamData.data)
      } else {
        console.error('❌ Team performance API error:', teamResponse.status, teamResponse.statusText)
      }
    } catch (error) {
      console.error('Error loading AI insights:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateInsights = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-insights/forecasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'monthly' })
      })

      if (response.ok) {
        toast({
          title: "🧠 AI Insights Generated",
          description: "Fresh predictions and forecasts are ready!",
        })
        await loadAIInsights()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateTeamAnalysis = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Generating team analysis...')
      const response = await fetch('/api/ai-insights/team-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Team analysis generated:', result)
        toast({
          title: "👥 Team Analysis Updated",
          description: "Fresh team performance insights generated!",
        })
        await loadAIInsights()
      } else {
        console.error('❌ Generate team analysis error:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('❌ Error details:', errorData)
      }
    } catch (error) {
      console.error('❌ Generate team analysis exception:', error)
      toast({
        title: "Error",
        description: "Failed to generate team analysis",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 8.0) return 'text-green-600'
    if (score >= 6.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recognition_suggestion': return <Award className="h-4 w-4 text-yellow-600" />
      case 'coaching_opportunity': return <UserCheck className="h-4 w-4 text-blue-600" />
      case 'process_improvement': return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'concern_alert': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Lightbulb className="h-4 w-4 text-gray-600" />
    }
  }

  const syncRealTimeData = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Starting real-time data sync...')
      const response = await fetch('/api/sync/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Real-time sync completed:', result)
        toast({
          title: "🔄 Real-Time Data Synced",
          description: "Performance data updated with live quotation data!",
        })
        await loadAIInsights()
      } else {
        console.error('❌ Sync real-time data error:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('❌ Error details:', errorData)
        toast({
          title: "Sync Error",
          description: errorData.error || "Failed to sync real-time data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Sync real-time data exception:', error)
      toast({
        title: "Error",
        description: "Failed to sync real-time data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI Business Insights
          </h1>
          <p className="text-muted-foreground">
            Intelligent predictions and recommendations powered by machine learning
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncRealTimeData} disabled={isLoading} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            {isLoading ? 'Syncing...' : 'Sync Real Data'}
          </Button>
          <Button onClick={generateInsights} disabled={isLoading}>
            <Zap className="h-4 w-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Fresh Insights'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="team-performance" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Performance
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecasts
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
                <Brain className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">Model accuracy</p>
                <Progress value={87} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73%</div>
                <p className="text-xs text-muted-foreground">Predicted conversions</p>
                <Progress value={73} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Forecast</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹12.5L</div>
                <p className="text-xs text-muted-foreground">Next month prediction</p>
                <div className="text-xs text-green-600 mt-1">+15% growth</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamPerformance?.team_members?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active sales reps</p>
                <div className="text-xs text-blue-600 mt-1">
                  {teamPerformance?.management_insights?.length || 0} insights
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Conversion Trend Up</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your quotation success rate has improved by 23% this month. 
                    Quick follow-ups and seasonal demand are key factors.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Peak Season Alert</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Wedding season is approaching. Expect 30% higher demand in the next 3 months.
                    Consider adjusting capacity and pricing strategies.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">Team Performance Pattern</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Team conversion rate is {teamPerformance?.team_overview?.team_conversion_rate ? 
                      (teamPerformance.team_overview.team_conversion_rate * 100).toFixed(1) : 'N/A'}%. 
                    {teamPerformance?.management_insights?.filter(i => i.insight_type === 'coaching_opportunity').length || 0} members need coaching support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team-performance" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sales Team Performance Analysis
            </h2>
            <Button onClick={generateTeamAnalysis} disabled={isLoading} variant="outline">
              <Brain className="h-4 w-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>

          {teamPerformance ? (
            <>
              {/* Team Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Conversion</CardTitle>
                    <Target className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {teamPerformance.team_overview?.team_conversion_rate ? 
                        (teamPerformance.team_overview.team_conversion_rate * 100).toFixed(1) : '0'}%
                    </div>
                    <p className="text-xs text-muted-foreground">Average conversion rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹{teamPerformance.team_overview?.total_revenue ? 
                        Math.round(teamPerformance.team_overview.total_revenue / 100000) / 10 : 0}L
                    </div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
                    <Activity className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {teamPerformance.team_overview?.avg_performance_score ? 
                        teamPerformance.team_overview.avg_performance_score.toFixed(1) : '0'}/10
                    </div>
                    <p className="text-xs text-muted-foreground">Average score</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quotations Created</CardTitle>
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {teamPerformance.team_overview?.total_quotations || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Individual Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    Individual Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Detailed performance breakdown for each team member (Current Period)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamPerformance.individual_performance
                      .filter(member => {
                        // Only show metrics from the current period (most recent)
                        const currentPeriod = new Date().toISOString().slice(0, 7) + '-01'
                        return member.metric_period === currentPeriod || 
                               teamPerformance.individual_performance.every(m => m.metric_period !== currentPeriod)
                      })
                      .map((member, memberIndex) => {
                        const memberInfo = teamPerformance.team_members.find(tm => tm.employee_id === member.employee_id)
                        return (
                          <div key={`member-${memberIndex}-${member.employee_id}-${member.metric_period}`} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">{memberInfo?.full_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {memberInfo?.role} • {memberInfo?.territory}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${getPerformanceColor(member.performance_score)}`}>
                                  {member.performance_score.toFixed(1)}/10
                                </div>
                                <p className="text-xs text-muted-foreground">Performance Score</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Quotes Created:</span>
                                <div className="font-medium">{member.quotations_created}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Conversion Rate:</span>
                                <div className="font-medium">{(member.conversion_rate * 100).toFixed(1)}%</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Revenue:</span>
                                <div className="font-medium">₹{member.total_revenue_generated.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Activity Score:</span>
                                <div className="font-medium">{member.activity_score.toFixed(1)}/10</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Management Insights & Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircleQuestion className="h-5 w-5 text-purple-600" />
                    AI-Generated Management Questions
                  </CardTitle>
                  <CardDescription>
                    Intelligent questions to ask your sales head for better team management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {teamPerformance.management_insights.map((insight, index) => (
                      <div key={`insight-${index}-${insight.insight_type}-${insight.employee_id || 'team'}`} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getInsightIcon(insight.insight_type)}
                            <h4 className="font-medium">{insight.title}</h4>
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                          </div>
                          <div className={`text-sm font-medium ${getConfidenceColor(insight.confidence_score)}`}>
                            {Math.round(insight.confidence_score * 100)}% confidence
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">
                          {insight.description}
                        </p>

                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <MessageCircleQuestion className="h-4 w-4" />
                              Suggested Questions to Ask:
                            </h5>
                            <ul className="space-y-2">
                              {insight.suggested_questions.map((question, qIndex) => (
                                <li key={`question-${index}-${qIndex}`} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                  💭 {question}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Recommended Actions:
                            </h5>
                            <ul className="space-y-1">
                              {insight.recommended_actions.map((action, aIndex) => (
                                <li key={`action-${index}-${aIndex}`} className="text-sm flex items-center gap-2">
                                  <ArrowUp className="h-3 w-3 text-green-600" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No team performance data available. Generate fresh analysis to see insights.
                </p>
                <Button onClick={generateTeamAnalysis} disabled={isLoading}>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Team Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Revenue Forecasting
              </CardTitle>
              <CardDescription>
                AI-powered revenue predictions based on historical data and market trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forecasts.length > 0 ? (
                <div className="space-y-4">
                  {forecasts.slice(0, 6).map((forecast, index) => (
                    <div key={`forecast-${index}-${forecast.period_start}`} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          {forecast.period_start} - {forecast.period_end}
                        </span>
                        <Badge variant="outline" className="text-blue-600">
                          ₹{forecast.predicted_revenue.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Range: ₹{forecast.confidence_interval_low.toLocaleString()} - 
                        ₹{forecast.confidence_interval_high.toLocaleString()}
                      </div>
                      <Progress 
                        value={75} 
                        className="mt-2" 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No forecasts generated yet. Click "Generate Fresh Insights" to create predictions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Intelligent action suggestions to improve your quotation success rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{rec.title}</h4>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {rec.description}
                          </p>
                          <div className="text-sm">
                            <strong>Suggested Action:</strong> {rec.suggested_action}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {rec.reasoning}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getConfidenceColor(rec.confidence_score)}`}>
                            {Math.round(rec.confidence_score * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No recommendations available. Generate insights from quotation data to see AI suggestions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Success Predictions
              </CardTitle>
              <CardDescription>
                AI predictions for individual quotation success probability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Quotation-specific predictions will appear here when you analyze individual quotes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 