"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Target, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Bot, 
  BarChart3,
  Activity,
  Calendar,
  DollarSign,
  RefreshCw
} from "lucide-react"
import { useState, useEffect } from "react"
import { getTaskGenerationSummary, getLeadTaskAnalytics } from "@/actions/lead-task-integration-hooks"

interface TaskGenerationStats {
  totalTasks: number
  successRate: number
  revenueProtected: number
  activeLeads: number
  completedTasks: number
  overdueTasks: number
  urgentTasks: number
}

interface LeadTaskActivity {
  id: string
  eventType: string
  leadName: string
  taskType: string
  priority: string
  generatedAt: string
  success: boolean
  businessRule: string
  estimatedValue: number
}

export function LeadTaskIntegrationDashboard() {
  const [stats, setStats] = useState<TaskGenerationStats>({
    totalTasks: 0,
    successRate: 0,
    revenueProtected: 0,
    activeLeads: 0,
    completedTasks: 0,
    overdueTasks: 0,
    urgentTasks: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<LeadTaskActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<string>('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load task generation summary
      const summaryData = await getTaskGenerationSummary()
      setSummary(summaryData)
      
      // Generate mock stats for demonstration
      setStats({
        totalTasks: 47,
        successRate: 94,
        revenueProtected: 2400000,
        activeLeads: 23,
        completedTasks: 34,
        overdueTasks: 8,
        urgentTasks: 12
      })

      // Generate mock activity data
      setRecentActivity([
        {
          id: '1',
          eventType: 'lead_assigned',
          leadName: 'ABC Corp',
          taskType: 'lead_follow_up',
          priority: 'medium',
          generatedAt: '2025-01-14T10:30:00Z',
          success: true,
          businessRule: 'lead_assignment_initial_contact',
          estimatedValue: 150000
        },
        {
          id: '2',
          eventType: 'quotation_sent',
          leadName: 'XYZ Ltd',
          taskType: 'quotation_follow_up',
          priority: 'high',
          generatedAt: '2025-01-14T09:15:00Z',
          success: true,
          businessRule: 'quotation_followup_task',
          estimatedValue: 250000
        },
        {
          id: '3',
          eventType: 'lead_status_changed',
          leadName: 'DEF Industries',
          taskType: 'quotation_approval',
          priority: 'high',
          generatedAt: '2025-01-14T08:45:00Z',
          success: true,
          businessRule: 'quotation_preparation_task',
          estimatedValue: 180000
        },
        {
          id: '4',
          eventType: 'lead_assigned',
          leadName: 'GHI Enterprises',
          taskType: 'lead_follow_up',
          priority: 'urgent',
          generatedAt: '2025-01-14T08:20:00Z',
          success: true,
          businessRule: 'high_value_lead_escalation',
          estimatedValue: 500000
        }
      ])
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount.toLocaleString()}`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-blue-600 animate-spin" />
          <h2 className="text-2xl font-bold">Loading Lead-Task Integration Dashboard...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Lead-Task Integration Dashboard</h2>
            <p className="text-muted-foreground">AI-powered lead management and task automation</p>
          </div>
        </div>
        <Button 
          onClick={loadDashboardData} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks Generated</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalTasks}</p>
                <p className="text-sm text-green-600">+12 from yesterday</p>
              </div>
              <Target className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{stats.successRate}%</p>
                <Progress value={stats.successRate} className="mt-2" />
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Protected</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(stats.revenueProtected)}</p>
                <p className="text-sm text-green-600">+₹340K this month</p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                <p className="text-3xl font-bold text-orange-600">{stats.activeLeads}</p>
                <p className="text-sm text-blue-600">{stats.urgentTasks} urgent tasks</p>
              </div>
              <Users className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Task Generation Activity
              </CardTitle>
              <CardDescription>
                Latest AI task generation events from lead activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${activity.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium">{activity.leadName}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.eventType} → {activity.taskType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={getPriorityColor(activity.priority)}>
                        {activity.priority}
                      </Badge>
                      <span className="text-sm font-medium">{formatCurrency(activity.estimatedValue)}</span>
                      <span className="text-sm text-muted-foreground">{formatTime(activity.generatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Task Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed Tasks</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stats.completedTasks / stats.totalTasks) * 100} className="w-20" />
                      <span className="text-sm font-medium">{stats.completedTasks}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overdue Tasks</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stats.overdueTasks / stats.totalTasks) * 100} className="w-20" />
                      <span className="text-sm font-medium text-red-600">{stats.overdueTasks}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Urgent Tasks</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stats.urgentTasks / stats.totalTasks) * 100} className="w-20" />
                      <span className="text-sm font-medium text-orange-600">{stats.urgentTasks}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Business Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenueProtected)}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue Protected</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-blue-600">24h</p>
                      <p className="text-xs text-muted-foreground">Avg Response Time</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-purple-600">94%</p>
                      <p className="text-xs text-muted-foreground">Lead Conversion</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Business Insights
              </CardTitle>
              <CardDescription>
                Intelligent analysis and recommendations from the AI task system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-medium text-blue-800">🎯 Pipeline Optimization</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    AI has identified 3 high-value leads requiring immediate attention. Average time to first contact has improved by 40% with automated task generation.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-800">💰 Revenue Protection</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Intelligent task scheduling has prevented potential revenue loss of ₹2.4M by ensuring timely follow-ups and preventing lead abandonment.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-medium text-purple-800">⚡ Efficiency Gains</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Automation has replaced manual follow-up tracking with 47 intelligent tasks, reducing administrative overhead by 60%.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-medium text-orange-800">📈 Performance Trends</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Lead qualification speed has increased by 35% with AI-driven task prioritization. Team productivity is at an all-time high.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                AI Integration Summary
              </CardTitle>
              <CardDescription>
                Complete overview of lead-task integration performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                  {summary || 'Loading summary...'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-green-800">Lead Integration</p>
                <p className="text-sm text-green-600">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-green-800">Task Generation</p>
                <p className="text-sm text-green-600">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-green-800">AI Analytics</p>
                <p className="text-sm text-green-600">Real-time</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 