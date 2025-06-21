"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  ArrowDown,
  Send,
  Loader2
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from 'date-fns'
import { TestRealtimeButton } from '@/components/test-realtime-button'
import { Separator } from "@/components/ui/separator"

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
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: Date
  }>>([
    {
      id: '1',
      type: 'ai',
      content: 'Ready to assist with your photography business, Vikas! I have full access to your client data, quotations, and team performance. Just ask me anything - like "what\'s my revenue this month" or "which clients need follow-up" or "show me Ramya\'s event details".',
      timestamp: new Date()
    }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading])

  // Focus input after sending message
  useEffect(() => {
    if (!isChatLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isChatLoading])

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
        
        // Show helpful message if no team data
        if (teamData.message && teamData.message.includes('empty state')) {
          console.log('ℹ️ No team performance data available - showing setup guidance')
        }
      } else {
        console.error('❌ Team performance API error:', teamResponse.status, teamResponse.statusText)
        // Set empty performance data to avoid crashes
        setTeamPerformance({
          team_overview: null,
          individual_performance: [],
          management_insights: [],
          team_members: []
        })
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

  const sendMessage = async () => {
    if (!currentMessage.trim() || isChatLoading) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: currentMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsChatLoading(true)

    try {
      const response = await fetch('/api/ai-simple-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          conversationHistory: chatMessages.slice(-8) // Send last 8 messages for context
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai' as const,
          content: data.message,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ai-chat" className="flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4" />
            AI Chat
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
          <TabsTrigger value="developers" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Developers Zone
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

        {/* AI Chat Tab */}
        <TabsContent value="ai-chat" className="space-y-6">
          <Card className="h-[750px] flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 border-none shadow-xl">
            <CardHeader className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <MessageCircleQuestion className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold">Your Business Partner AI</div>
                  <div className="text-sm text-white/80 font-normal">
                    Strategic advisor with full business intelligence • Local llama3.1:8b
                  </div>
                </div>
                <Badge className="bg-green-500 text-white border-none px-3 py-1">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 bg-white">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`flex items-end gap-3 max-w-[75%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-br from-purple-500 to-pink-500'
                        }`}>
                          {message.type === 'user' ? 'You' : 'AI'}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`relative rounded-2xl px-4 py-3 shadow-md ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                        }`}>
                          <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                          <div className={`text-xs mt-2 ${
                            message.type === 'user' ? 'text-white/70' : 'text-gray-400'
                          }`}>
                            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="flex justify-start group">
                      <div className="flex items-end gap-3 max-w-[75%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                          AI
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-md">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                            <span className="text-sm text-gray-600">AI is crafting your response...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Auto-scroll anchor */}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="flex-shrink-0 p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask me anything about our business... revenue, clients, strategy, opportunities 📈"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      disabled={isChatLoading}
                      className="pr-12 py-3 rounded-full border-2 border-purple-200 focus:border-purple-400 bg-white shadow-sm text-gray-800 placeholder:text-gray-500 font-medium"
                    />
                    {currentMessage.trim() && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Button 
                          onClick={sendMessage} 
                          disabled={!currentMessage.trim() || isChatLoading}
                          size="sm"
                          className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-none shadow-lg"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    'What\'s our biggest opportunity right now?',
                    'Should we follow up with Jothi about that ₹50k quote?', 
                    'How\'s our cash flow looking this month?',
                    'Which clients are we losing and why?',
                    'What\'s our growth strategy for next quarter?'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setCurrentMessage(suggestion)}
                      className="text-xs px-3 py-1.5 bg-white/80 hover:bg-white border border-purple-200 rounded-full text-purple-700 hover:text-purple-800 transition-all duration-200 hover:shadow-sm"
                      disabled={isChatLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
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

        {/* Developers Zone Tab */}
        <TabsContent value="developers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                🔧 Developer Testing Zone
              </CardTitle>
              <CardDescription>
                Development and testing tools - Remove this section when ready for production
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Real-Time System Test */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  ⚡ Real-Time System Test
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  This section is for testing real-time notifications. Remove this section when ready for production.
                </p>
                <TestRealtimeButton />
              </div>

              {/* Real-Time Test */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <h4 className="font-medium text-blue-800">Real-Time Test:</h4>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Tests basic notification delivery system</li>
                  <li>• 🟢 If real-time works: Badge updates instantly</li>
                  <li>• 🔴 If real-time fails: Badge updates within 5 seconds (polling mode)</li>
                </ul>
              </div>

              {/* Business Integration Test */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  🏢 Business Integration Test
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h4 className="font-medium text-green-800">Business Notification Test:</h4>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 📊 Quotation created/approved notifications</li>
                  <li>• 💰 Payment received alerts</li>
                  <li>• 🤖 AI-powered low success probability warnings</li>
                  <li>• ⚠️ Team performance anomaly alerts</li>
                  <li>• 📅 Event deadline approaching notifications</li>
                </ul>
                <p className="text-xs text-green-600 mt-3 font-medium">
                  This simulates real business events!
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-2">📋 Instructions:</h3>
                <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                  <li>Click either test button above</li>
                  <li>Check the browser console for detailed logs</li>
                  <li>Watch the notification bell for badge updates</li>
                  <li>Click the bell to see the different notification types</li>
                  <li>Test "mark as read" functionality</li>
                </ol>
              </div>

              {/* Production Ready Note */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">🚀 Production Ready:</h3>
                <p className="text-sm text-purple-700">
                  Remove this testing section when deploying!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 