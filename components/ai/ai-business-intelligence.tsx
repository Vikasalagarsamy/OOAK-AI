"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Brain, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Send, 
  Lightbulb,
  Target,
  BarChart3,
  PieChart,
  Zap,
  Star,
  ArrowRight,
  Database,
  Settings,
  Sparkles,
  Loader2
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { AIBusinessIntelligenceService } from "@/services/ai-business-intelligence-service"

interface AIBusinessIntelligenceProps {
  user: any
}

interface AIInsight {
  id: string
  type: 'alert' | 'opportunity' | 'recommendation' | 'trend'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  timestamp: Date
}

interface OrganizationQuestion {
  id: string
  question: string
  targetRole?: string
  targetDepartment?: string
  responses: number
  totalTargets: number
  status: 'draft' | 'active' | 'completed'
  createdAt: Date
}

export function AIBusinessIntelligence({ user }: AIBusinessIntelligenceProps) {
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: Date
  }>>([
    {
      id: '1',
      type: 'ai',
      content: `Good evening, ${user.username}! I'm your AI Business Intelligence Assistant. I've analyzed your organization's current state and I'm ready to help you make strategic decisions. What would you like to explore today?`,
      timestamp: new Date()
    }
  ])
  
  const [currentMessage, setCurrentMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState<'insights' | 'chat' | 'surveys'>('insights')
  const [newQuestion, setNewQuestion] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [businessData, setBusinessData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Load real business intelligence data on component mount
  useEffect(() => {
    loadBusinessIntelligenceData()
  }, [])

  const loadBusinessIntelligenceData = async () => {
    try {
      setIsLoadingData(true)
      const biService = new AIBusinessIntelligenceService()
      const data = await biService.getComprehensiveBusinessData()
      const insights = await biService.generateAIInsights(data)
      
      setBusinessData(data)
      
      // Update AI insights with real data
      const realInsights: AIInsight[] = insights.map((insight, index) => ({
        id: `insight_${index}`,
        type: insight.includes('🚨') ? 'alert' : 
              insight.includes('📈') ? 'opportunity' :
              insight.includes('🎯') ? 'trend' : 'recommendation',
        title: insight.split(' - ')[0].replace(/[🚨📈🎯👥🏆🎣]/g, '').trim(),
        description: insight.split(' - ')[1] || insight,
        priority: insight.includes('🚨') ? 'high' as const : 
                 insight.includes('📈') || insight.includes('🎯') ? 'medium' as const : 'low' as const,
        actionable: true,
        timestamp: new Date()
      }))
      
      if (realInsights.length > 0) {
        setAiInsights(realInsights)
      }
      
    } catch (error) {
      console.error("Failed to load business intelligence data:", error)
      toast({
        title: "Warning",
        description: "Using demo data - some features may be limited",
        variant: "destructive"
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // Real AI insights - updated from actual data
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'alert',
      title: 'Sales Performance Analysis',
      description: 'Loading real-time data to analyze your sales metrics and conversion rates...',
      priority: 'high',
      actionable: true,
      timestamp: new Date()
    }
  ])

  const [organizationQuestions, setOrganizationQuestions] = useState<OrganizationQuestion[]>([
    {
      id: '1',
      question: 'What tools or resources would help you be more productive in your role?',
      targetRole: 'All',
      responses: 12,
      totalTargets: 68,
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      question: 'Rate your satisfaction with current project management processes (1-10)',
      targetDepartment: 'Engineering',
      responses: 24,
      totalTargets: 24,
      status: 'completed',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ])

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: currentMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    const messageToSend = currentMessage
    setCurrentMessage("")
    setIsTyping(true)

    try {
      // Call the real AI API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      }])

    } catch (error) {
      console.error('Error sending message:', error)
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm having trouble accessing the business data right now. Please try again in a moment, or contact support if the issue persists.",
        timestamp: new Date()
      }])
      
      toast({
        title: "Connection Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsTyping(false)
    }
  }

  const sendOrganizationQuestion = async () => {
    if (!newQuestion.trim()) return

    const question: OrganizationQuestion = {
      id: Date.now().toString(),
      question: newQuestion,
      targetRole: targetRole || 'All',
      responses: 0,
      totalTargets: 68, // This would be calculated based on target criteria
      status: 'active',
      createdAt: new Date()
    }

    setOrganizationQuestions(prev => [question, ...prev])
    setNewQuestion("")
    setTargetRole("")
    
    toast({
      title: "Question Sent!",
      description: "Your question has been sent to the organization. Responses will appear in real-time.",
    })
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />
      case 'trend': return <BarChart3 className="h-5 w-5 text-blue-500" />
      default: return <Sparkles className="h-5 w-5 text-purple-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Status Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-purple-900">AI Business Intelligence</CardTitle>
              <CardDescription className="text-purple-700">
                Your intelligent business advisor - analyzing data, providing insights, and guiding strategic decisions
              </CardDescription>
            </div>
            <div className="ml-auto">
              <Badge className={isLoadingData ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-green-100 text-green-800 border-green-200"}>
                {isLoadingData ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Loading Data
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 mr-1" />
                    Active
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={activeTab === 'insights' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('insights')}
          className="gap-2"
        >
          <Target className="h-4 w-4" />
          AI Insights
        </Button>
        <Button
          variant={activeTab === 'chat' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('chat')}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          AI Chat
        </Button>
        <Button
          variant={activeTab === 'surveys' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('surveys')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Organization Pulse
        </Button>
      </div>

      {/* AI Insights Tab */}
      {activeTab === 'insights' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Strategic Insights
              </CardTitle>
              <CardDescription>
                AI-generated insights based on your organization's data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Analyzing your business data...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiInsights.map((insight) => (
                    <div key={insight.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                          {insight.actionable && (
                            <Button size="sm" variant="outline" className="text-xs">
                              Take Action <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Quick Analytics
              </CardTitle>
              <CardDescription>
                Key performance indicators at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading analytics...</span>
                </div>
              ) : businessData ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Total Revenue</span>
                      <span className="text-lg font-bold text-blue-600">₹{businessData.sales.totalRevenue.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">From {businessData.sales.totalQuotations} quotations</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-900">Conversion Rate</span>
                      <span className="text-lg font-bold text-green-600">{businessData.sales.conversionRate.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">Quotation to client conversion</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-900">Team Size</span>
                      <span className="text-lg font-bold text-purple-600">{businessData.employees.totalEmployees}</span>
                    </div>
                    <p className="text-xs text-purple-700 mt-1">{businessData.employees.recentHires} recent hires</p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-900">Active Leads</span>
                      <span className="text-lg font-bold text-orange-600">{businessData.operations.activeLeads}</span>
                    </div>
                    <p className="text-xs text-orange-700 mt-1">{businessData.operations.leadConversionRate.toFixed(1)}% conversion rate</p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Database className="h-8 w-8 mx-auto mb-2" />
                  <p>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Chat Tab */}
      {activeTab === 'chat' && (
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Business Intelligence Chat
            </CardTitle>
            <CardDescription>
              Ask me anything about your business - I'll analyze data and provide strategic guidance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 mb-4 p-4 border rounded-lg">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ask me about sales, team performance, growth strategies..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!currentMessage.trim() || isTyping}>
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Pulse Tab */}
      {activeTab === 'surveys' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Ask Your Organization
              </CardTitle>
              <CardDescription>
                Send questions to specific roles or departments to gather insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="What would you like to ask your team? e.g., 'What's the biggest challenge in your daily work?'"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={3}
                />
                <Input
                  placeholder="Target role/department (optional - leave blank for all)"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
                <Button 
                  onClick={sendOrganizationQuestion} 
                  disabled={!newQuestion.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Question to Organization
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Active Surveys
              </CardTitle>
              <CardDescription>
                Track responses to your organizational questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizationQuestions.map((question) => (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium flex-1">{question.question}</p>
                      <Badge variant={question.status === 'completed' ? 'default' : 'secondary'}>
                        {question.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Target: {question.targetRole || question.targetDepartment}</span>
                      <span>Responses: {question.responses}/{question.totalTargets}</span>
                      <span>{question.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{width: `${(question.responses / question.totalTargets) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 