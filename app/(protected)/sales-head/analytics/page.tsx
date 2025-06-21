'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Phone, 
  PhoneCall, 
  Mic,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Star,
  ThumbsUp,
  ThumbsDown,
  User,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Database,
  Activity,
  FileText,
  Zap,
  Brain,
  Target,
  MessageSquare,
  Eye,
  Shield,
  Crown
} from 'lucide-react'
import { createClient } from '@/lib/postgresql-client-unified'
import { toast } from '@/components/ui/use-toast'

// Call Analytics interfaces
interface CallTranscription {
  id: string
  call_id: string
  client_name: string
  sales_agent: string
  phone_number: string
  duration: number
  transcript: string
  confidence_score: number
  created_at: string
}

interface CallAnalytics {
  id: string
  call_id: string
  overall_sentiment: string
  sentiment_score: number
  client_sentiment: string
  agent_sentiment: string
  call_intent: string
  key_topics: string[]
  agent_performance?: any
  risk_level: string
  call_quality_score: number
  quote_discussed: boolean
  budget_mentioned: boolean
  timeline_discussed: boolean
  next_steps_agreed: boolean
  follow_up_required: boolean
  forbidden_words_detected?: string[]
  compliance_issues?: string[]
  created_at: string
}

export default function SalesHeadAnalyticsDashboard() {
  // Call Analytics state
  const [transcriptions, setTranscriptions] = useState<CallTranscription[]>([])
  const [analytics, setAnalytics] = useState<CallAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<CallTranscription | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Add transcript form
  const [newTranscript, setNewTranscript] = useState({
    client_name: '',
    sales_agent: 'Vikas Alagarsamy',
    phone_number: '',
    duration: 300,
    transcript: ''
  })

  const { query, transaction } = createClient()

  useEffect(() => {
    fetchCallAnalyticsData()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchCallAnalyticsData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchCallAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching LIVE call analytics data for Sales Head...')
      
      // Fetch transcriptions
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('call_transcriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (transcriptError) {
        console.error('❌ Transcription fetch error:', transcriptError)
        throw new Error(`Transcription fetch failed: ${transcriptError.message}`)
      }

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('call_analytics')
        .select('*')
        .order('created_at', { ascending: false })

      if (analyticsError) {
        console.error('❌ Analytics fetch error:', analyticsError)
        throw new Error(`Analytics fetch failed: ${analyticsError.message}`)
      }

      console.log(`✅ LIVE DATA: ${transcriptData?.length || 0} transcriptions, ${analyticsData?.length || 0} analytics`)

      setTranscriptions((transcriptData || []) as unknown as CallTranscription[])
      setAnalytics((analyticsData || []) as unknown as CallAnalytics[])

    } catch (err) {
      console.error('❌ Failed to fetch call analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch call analytics data')
    } finally {
      setLoading(false)
    }
  }

  const addTestTranscript = async () => {
    try {
      if (!newTranscript.client_name || !newTranscript.transcript) {
        toast({
          title: "Error",
          description: "Please fill in client name and transcript",
          variant: "destructive"
        })
        return
      }

      const callId = `test_call_${Date.now()}`
      
      // Insert transcript
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('call_transcriptions')
        .insert({
          call_id: callId,
          client_name: newTranscript.client_name,
          sales_agent: newTranscript.sales_agent,
          phone_number: newTranscript.phone_number,
          duration: newTranscript.duration,
          transcript: newTranscript.transcript,
          confidence_score: 0.95,
          language: 'en'
        })
        .select()
        .single()

      if (transcriptError) throw transcriptError

      // Insert mock analytics
      const { error: analyticsError } = await supabase
        .from('call_analytics')
        .insert({
          call_id: callId,
          overall_sentiment: 'positive',
          sentiment_score: 0.8,
          client_sentiment: 'positive',
          agent_sentiment: 'positive',
          call_intent: 'quote_request',
          key_topics: ['pricing', 'photography', 'wedding'],
          risk_level: 'low',
          call_quality_score: 8.5,
          quote_discussed: true,
          budget_mentioned: true,
          timeline_discussed: true,
          next_steps_agreed: true,
          follow_up_required: true
        })

      if (analyticsError) throw analyticsError

      toast({
        title: "Success",
        description: "Test transcript added successfully!"
      })

      // Reset form and refresh data
      setNewTranscript({
        client_name: '',
        sales_agent: 'Vikas Alagarsamy',
        phone_number: '',
        duration: 300,
        transcript: ''
      })
      setShowAddForm(false)
      await fetchCallAnalyticsData()

    } catch (error) {
      console.error('❌ Error adding test transcript:', error)
      toast({
        title: "Error",
        description: "Failed to add test transcript",
        variant: "destructive"
      })
    }
  }

  const getAnalyticsForCall = (callId: string) => {
    return analytics.find(a => a.call_id === callId)
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      case 'neutral': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  // Calculate comprehensive statistics
  const callStats = {
    totalCalls: transcriptions.length,
    totalAnalytics: analytics.length,
    positiveCallsCount: analytics.filter(a => a.overall_sentiment === 'positive').length,
    negativeCallsCount: analytics.filter(a => a.overall_sentiment === 'negative').length,
    quotesDiscussed: analytics.filter(a => a.quote_discussed).length,
    budgetMentioned: analytics.filter(a => a.budget_mentioned).length,
    followUpRequired: analytics.filter(a => a.follow_up_required).length,
    highRiskCalls: analytics.filter(a => a.risk_level === 'high').length,
    avgCallQuality: analytics.length > 0 ? 
      (analytics.reduce((sum, a) => sum + a.call_quality_score, 0) / analytics.length).toFixed(1) : '0',
    avgConfidence: transcriptions.length > 0 ?
      (transcriptions.reduce((sum, t) => sum + t.confidence_score, 0) / transcriptions.length * 100).toFixed(1) : '0',
    totalDuration: transcriptions.reduce((sum, t) => sum + t.duration, 0),
    avgDuration: transcriptions.length > 0 ?
      (transcriptions.reduce((sum, t) => sum + t.duration, 0) / transcriptions.length).toFixed(0) : '0'
  }

  // Agent performance analysis
  const agentStats = transcriptions.reduce((acc, call) => {
    const agent = call.sales_agent
    if (!acc[agent]) {
      acc[agent] = { calls: 0, totalDuration: 0, analytics: [] }
    }
    acc[agent].calls += 1
    acc[agent].totalDuration += call.duration
    
    const callAnalytics = getAnalyticsForCall(call.call_id)
    if (callAnalytics) {
      acc[agent].analytics.push(callAnalytics)
    }
    
    return acc
  }, {} as Record<string, any>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🧠 AI Sales Intelligence Dashboard
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Advanced Call Analytics & Performance Insights (Sales Head Only)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              <Database className="h-3 w-3 mr-1" />
              Whisper Large V3
            </Badge>
            <Badge variant="outline" className="text-blue-600">
              <Brain className="h-3 w-3 mr-1" />
              AI Analytics
            </Badge>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transcripts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Call Transcripts
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Agent Performance
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls Processed</CardTitle>
                  <Phone className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{callStats.totalCalls}</div>
                  <p className="text-xs text-green-600">
                    {callStats.totalAnalytics} analyzed by AI
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sentiment Analysis</CardTitle>
                  <ThumbsUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    {callStats.positiveCallsCount}/{callStats.totalAnalytics}
                  </div>
                  <p className="text-xs text-blue-600">
                    {((callStats.positiveCallsCount / callStats.totalAnalytics) * 100 || 0).toFixed(1)}% positive sentiment
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Business Conversion</CardTitle>
                  <Target className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">{callStats.quotesDiscussed}</div>
                  <p className="text-xs text-purple-600">
                    {((callStats.quotesDiscussed / callStats.totalAnalytics) * 100 || 0).toFixed(1)}% quote discussion rate
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Quality Score</CardTitle>
                  <Star className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">{callStats.avgCallQuality}/10</div>
                  <p className="text-xs text-orange-600">
                    {callStats.avgConfidence}% transcription confidence
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>High Risk Calls:</span>
                    <Badge variant="destructive">{callStats.highRiskCalls}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Follow-up Required:</span>
                    <Badge variant="outline">{callStats.followUpRequired}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget Discussions:</span>
                    <Badge variant="secondary">{callStats.budgetMentioned}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Call Volume Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span>{Math.floor(callStats.totalDuration / 3600)}h {Math.floor((callStats.totalDuration % 3600) / 60)}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Call Length:</span>
                    <span>{Math.floor(Number(callStats.avgDuration) / 60)}m {Number(callStats.avgDuration) % 60}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Negative Sentiment:</span>
                    <Badge variant="outline" className="text-red-600">{callStats.negativeCallsCount}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-500" />
                    AI Processing Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Processing Rate:</span>
                    <Badge variant="outline" className="text-green-600">
                      {((callStats.totalAnalytics / callStats.totalCalls) * 100 || 0).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <Badge variant="secondary">Large V3</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CALL TRANSCRIPTS TAB */}
          <TabsContent value="transcripts" className="space-y-6">
            {/* Controls */}
            <div className="flex gap-4 items-center">
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Call
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Test Call Transcript</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="client_name">Client Name</Label>
                        <Input
                          id="client_name"
                          value={newTranscript.client_name}
                          onChange={(e) => setNewTranscript({...newTranscript, client_name: e.target.value})}
                          placeholder="Enter client name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          value={newTranscript.phone_number}
                          onChange={(e) => setNewTranscript({...newTranscript, phone_number: e.target.value})}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="transcript">Call Transcript</Label>
                      <Textarea
                        id="transcript"
                        value={newTranscript.transcript}
                        onChange={(e) => setNewTranscript({...newTranscript, transcript: e.target.value})}
                        placeholder="Enter the call transcript here..."
                        rows={8}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addTestTranscript}>
                        Add Call
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={fetchCallAnalyticsData} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Database className="h-4 w-4" />
                Live Data: {transcriptions.length} calls, {analytics.length} analyzed
              </div>
            </div>

            {/* Loading/Error States */}
            {loading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Loading AI call analytics data...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error: {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Call Transcripts Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Call Transcriptions & AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>AI Confidence</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead>Call Quality</TableHead>
                        <TableHead>Key Topics</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transcriptions.slice(0, 20).map((call) => {
                        const callAnalytics = getAnalyticsForCall(call.call_id)
                        return (
                          <TableRow key={call.id}>
                            <TableCell>
                              <div className="font-medium">{call.client_name}</div>
                              <div className="text-sm text-gray-500">{call.phone_number}</div>
                            </TableCell>
                            <TableCell>{call.sales_agent}</TableCell>
                            <TableCell>{Math.floor(call.duration / 60)}m {call.duration % 60}s</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={Number(call.confidence_score) > 0.9 ? 'text-green-600' : 'text-yellow-600'}>
                                {(call.confidence_score * 100).toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {callAnalytics && (
                                <span className={getSentimentColor(callAnalytics.overall_sentiment)}>
                                  {callAnalytics.overall_sentiment}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {callAnalytics && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  {callAnalytics.call_quality_score}/10
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {callAnalytics && (
                                <div className="flex flex-wrap gap-1">
                                  {callAnalytics.key_topics.slice(0, 2).map((topic, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {callAnalytics && (
                                <Badge className={getRiskColor(callAnalytics.risk_level)}>
                                  {callAnalytics.risk_level}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(call.created_at)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCall(call)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AGENT PERFORMANCE TAB */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Agent Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(agentStats).map(([agent, stats]) => (
                    <Card key={agent}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{agent}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Calls:</span>
                          <Badge variant="outline">{stats.calls}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Duration:</span>
                          <span>{Math.floor(stats.totalDuration / 60)}m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Quality:</span>
                          <span>
                            {stats.analytics.length > 0 ? 
                              (stats.analytics.reduce((sum: number, a: any) => sum + a.call_quality_score, 0) / stats.analytics.length).toFixed(1)
                              : 'N/A'
                            }/10
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Positive Calls:</span>
                          <span>
                            {stats.analytics.filter((a: any) => a.overall_sentiment === 'positive').length}/{stats.analytics.length}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI INSIGHTS TAB */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sentiment Trend:</strong> {callStats.positiveCallsCount > callStats.negativeCallsCount ? 
                        'Positive sentiment is trending upward' : 'Attention needed: negative sentiment detected'}
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Conversion Opportunity:</strong> {callStats.quotesDiscussed} calls discussed pricing - 
                      {callStats.budgetMentioned} mentioned specific budgets
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Follow-up Required:</strong> {callStats.followUpRequired} calls need immediate attention
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>AI Model:</span>
                    <Badge variant="secondary">Whisper Large V3</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Speed:</span>
                    <Badge variant="outline" className="text-green-600">Real-time</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy Rate:</span>
                    <Badge variant="outline" className="text-green-600">{callStats.avgConfidence}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Language Support:</span>
                    <Badge variant="secondary">Tamil, Telugu, Kannada, Malayalam</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call Details Dialog */}
        {selectedCall && (
          <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>🔍 Detailed Call Analysis: {selectedCall.client_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Call Information</h4>
                    <p>Agent: {selectedCall.sales_agent}</p>
                    <p>Duration: {Math.floor(selectedCall.duration / 60)}m {selectedCall.duration % 60}s</p>
                    <p>AI Confidence: {(selectedCall.confidence_score * 100).toFixed(1)}%</p>
                    <p>Date: {formatDate(selectedCall.created_at)}</p>
                  </div>
                  {getAnalyticsForCall(selectedCall.call_id) && (
                    <div>
                      <h4 className="font-semibold">AI Analytics</h4>
                      <div className="space-y-1">
                        <p>Sentiment: <span className={getSentimentColor(getAnalyticsForCall(selectedCall.call_id)!.overall_sentiment)}>
                          {getAnalyticsForCall(selectedCall.call_id)!.overall_sentiment}
                        </span></p>
                        <p>Call Quality: {getAnalyticsForCall(selectedCall.call_id)!.call_quality_score}/10</p>
                        <p>Quote Discussed: {getAnalyticsForCall(selectedCall.call_id)!.quote_discussed ? '✅ Yes' : '❌ No'}</p>
                        <p>Budget Mentioned: {getAnalyticsForCall(selectedCall.call_id)!.budget_mentioned ? '✅ Yes' : '❌ No'}</p>
                        <p>Follow-up Required: {getAnalyticsForCall(selectedCall.call_id)!.follow_up_required ? '⚠️ Yes' : '✅ No'}</p>
                        <p>Risk Level: <Badge className={getRiskColor(getAnalyticsForCall(selectedCall.call_id)!.risk_level)}>
                          {getAnalyticsForCall(selectedCall.call_id)!.risk_level}
                        </Badge></p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Full Transcript (Whisper Large V3)</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{selectedCall.transcript}</p>
                  </div>
                </div>
                {getAnalyticsForCall(selectedCall.call_id) && (
                  <div>
                    <h4 className="font-semibold mb-2">AI-Identified Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {getAnalyticsForCall(selectedCall.call_id)!.key_topics.map((topic, idx) => (
                        <Badge key={idx} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
} 