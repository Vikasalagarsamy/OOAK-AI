"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer 
} from 'recharts'
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Zap,
  Activity,
  BarChart3,
  RefreshCw
} from "lucide-react"

interface AnalyticsMetric {
  id: string
  metricName: string
  metricType: string
  metricValue: number
  metricUnit: string
  timePeriod: string
  recordedAt: string
}

interface EngagementData {
  userId: string
  engagementType: string
  channel: string
  contextData: any
  createdAt: string
}

interface ChartEngagementData {
  day: string
  inApp: number
  whatsapp: number
  email: number
}

interface AIPerformanceData {
  modelType: string
  accuracyScore: number
  confidenceScore: number
  modelVersion: string
  createdAt: string
}

interface ChartAIData {
  hour: string
  timing: number
  personalization: number
  content: number
}

export default function AdvancedAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])
  const [chartEngagementData, setChartEngagementData] = useState<ChartEngagementData[]>([])
  const [chartAIData, setChartAIData] = useState<ChartAIData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    loadAnalyticsData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Simulate API calls for analytics data
      // In production, these would be real API endpoints
      const simulatedMetrics: AnalyticsMetric[] = [
        {
          id: '1',
          metricName: 'notification_engagement_rate',
          metricType: 'engagement',
          metricValue: 85.5,
          metricUnit: 'percentage',
          timePeriod: 'daily',
          recordedAt: new Date().toISOString()
        },
        {
          id: '2',
          metricName: 'ai_timing_accuracy',
          metricType: 'ai_accuracy',
          metricValue: 80.2,
          metricUnit: 'percentage',
          timePeriod: 'daily',
          recordedAt: new Date().toISOString()
        },
        {
          id: '3',
          metricName: 'whatsapp_delivery_rate',
          metricType: 'performance',
          metricValue: 95.7,
          metricUnit: 'percentage',
          timePeriod: 'daily',
          recordedAt: new Date().toISOString()
        },
        {
          id: '4',
          metricName: 'user_satisfaction_score',
          metricType: 'user_behavior',
          metricValue: 4.3,
          metricUnit: 'rating',
          timePeriod: 'daily',
          recordedAt: new Date().toISOString()
        }
      ]

      setMetrics(simulatedMetrics)

      // Simulate engagement data for charts
      const engagementData = generateEngagementData()
      setChartEngagementData(engagementData)

      // Simulate AI performance data
      const aiData = generateAIPerformanceData()
      setChartAIData(aiData)

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateEngagementData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map(day => ({
      day,
      inApp: Math.floor(Math.random() * 100) + 50,
      whatsapp: Math.floor(Math.random() * 80) + 30,
      email: Math.floor(Math.random() * 60) + 20
    }))
  }

  const generateAIPerformanceData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    return hours.map(hour => ({
      hour: `${hour}:00`,
      timing: Math.random() * 0.3 + 0.7,
      personalization: Math.random() * 0.25 + 0.75,
      content: Math.random() * 0.2 + 0.8
    }))
  }

  const getMetricByName = (name: string) => {
    return metrics.find(m => m.metricName === name)?.metricValue || 0
  }

  const getMetricTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    }
  }

  // Sample previous day data for trend calculation
  const previousDayMetrics = {
    notification_engagement_rate: 82.1,
    ai_timing_accuracy: 78.5,
    whatsapp_delivery_rate: 94.2,
    user_satisfaction_score: 4.1
  }

  const channelDistribution = [
    { name: 'In-App', value: 45, color: '#8884d8' },
    { name: 'WhatsApp', value: 35, color: '#82ca9d' },
    { name: 'Email', value: 20, color: '#ffc658' }
  ]

  const aiModelPerformance = [
    { model: 'Timing AI', accuracy: 80.2, confidence: 85.1 },
    { model: 'Personalization AI', accuracy: 87.5, confidence: 82.3 },
    { model: 'Content AI', accuracy: 75.8, confidence: 78.9 },
    { model: 'Channel AI', accuracy: 83.2, confidence: 80.7 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Advanced Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time insights into AI performance, user engagement, and WhatsApp integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalyticsData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getMetricByName('notification_engagement_rate').toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +{getMetricTrend(getMetricByName('notification_engagement_rate'), previousDayMetrics.notification_engagement_rate).value}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Timing Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getMetricByName('ai_timing_accuracy').toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +{getMetricTrend(getMetricByName('ai_timing_accuracy'), previousDayMetrics.ai_timing_accuracy).value}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Delivery</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {getMetricByName('whatsapp_delivery_rate').toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +{getMetricTrend(getMetricByName('whatsapp_delivery_rate'), previousDayMetrics.whatsapp_delivery_rate).value}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {getMetricByName('user_satisfaction_score').toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground">
              +{getMetricTrend(getMetricByName('user_satisfaction_score'), previousDayMetrics.user_satisfaction_score).value} from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement Analytics</TabsTrigger>
          <TabsTrigger value="ai-performance">AI Performance</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp Metrics</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
        </TabsList>

        {/* Engagement Analytics */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Engagement rates by communication channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateEngagementData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inApp" fill="#8884d8" name="In-App" />
                    <Bar dataKey="whatsapp" fill="#82ca9d" name="WhatsApp" />
                    <Bar dataKey="email" fill="#ffc658" name="Email" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Notification delivery distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {channelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Performance */}
        <TabsContent value="ai-performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Performance</CardTitle>
                <CardDescription>Accuracy and confidence scores by model</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aiModelPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy %" />
                    <Bar dataKey="confidence" fill="#82ca9d" name="Confidence %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>24-Hour AI Performance</CardTitle>
                <CardDescription>Real-time AI model accuracy throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateAIPerformanceData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis domain={[0.6, 1]} />
                    <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="timing" stroke="#8884d8" name="Timing AI" />
                    <Line type="monotone" dataKey="personalization" stroke="#82ca9d" name="Personalization AI" />
                    <Line type="monotone" dataKey="content" stroke="#ffc658" name="Content AI" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiModelPerformance.map((model, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {model.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Accuracy</span>
                      <Badge variant={model.accuracy > 80 ? "default" : "secondary"}>
                        {model.accuracy.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <Badge variant={model.confidence > 80 ? "default" : "secondary"}>
                        {model.confidence.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* WhatsApp Metrics */}
        <TabsContent value="whatsapp" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">95.7%</div>
                <p className="text-xs text-muted-foreground">
                  +1.5% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">78.3%</div>
                <p className="text-xs text-muted-foreground">
                  +5.2% from last week
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Template Performance</CardTitle>
              <CardDescription>Performance metrics for different message templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Quotation Ready', sent: 342, delivered: 338, read: 287, rate: 83.9 },
                  { name: 'Follow-up Reminder', sent: 567, delivered: 552, read: 421, rate: 74.3 },
                  { name: 'Payment Received', sent: 198, delivered: 196, read: 184, rate: 92.9 },
                  { name: 'Order Update', sent: 423, delivered: 418, read: 356, rate: 84.2 }
                ].map((template, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {template.sent} sent • {template.delivered} delivered • {template.read} read
                      </p>
                    </div>
                    <Badge variant={template.rate > 80 ? "default" : "secondary"}>
                      {template.rate}% read rate
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalization */}
        <TabsContent value="personalization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Personalization Impact</CardTitle>
                <CardDescription>Engagement improvement with AI personalization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Generic Messages</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI Personalized</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-sm">78%</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-green-600 font-medium">
                      +73% improvement with AI personalization
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>Learned communication preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { style: 'Formal', percentage: 45, color: 'blue' },
                    { style: 'Friendly', percentage: 35, color: 'green' },
                    { style: 'Direct', percentage: 20, color: 'orange' }
                  ].map((pref, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{pref.style}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-${pref.color}-500 h-2 rounded-full`} 
                            style={{ width: `${pref.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm w-8">{pref.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 