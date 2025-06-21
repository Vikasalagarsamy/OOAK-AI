'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Phone, 
  PhoneCall, 
  Mic, 
  MicOff,
  FileAudio,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  StopCircle,
  Upload,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/postgresql-client-unified'

// Real Data Interfaces
interface CallTranscription {
  id: string
  call_id: string
  task_id?: string
  lead_id?: number
  client_name: string
  sales_agent: string
  phone_number: string
  duration: number
  recording_url?: string
  transcript: string
  confidence_score: number
  language: string
  created_at: string
}

interface CallAnalytics {
  id: string
  call_id: string
  overall_sentiment: 'positive' | 'negative' | 'neutral'
  sentiment_score: number
  client_sentiment: 'positive' | 'negative' | 'neutral'
  agent_sentiment: 'positive' | 'negative' | 'neutral'
  call_intent: string
  key_topics: string[]
  agent_performance: {
    professionalism_score: number
    responsiveness_score: number
    knowledge_score: number
    closing_effectiveness: number
  }
  client_behavior: {
    engagement_level: 'high' | 'medium' | 'low'
    interest_level: 'high' | 'medium' | 'low'
    buying_signals: string[]
    objection_handling: string[]
  }
  risk_level: 'low' | 'medium' | 'high'
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

interface RealDataSummary {
  total_transcriptions: number
  total_analytics: number
  forbidden_word_violations: number
  high_risk_calls: number
  positive_sentiment_calls: number
  last_call_date: string | null
}

export default function CallAnalyticsPage() {
  const [transcriptions, setTranscriptions] = useState<CallTranscription[]>([])
  const [analytics, setAnalytics] = useState<CallAnalytics[]>([])
  const [summary, setSummary] = useState<RealDataSummary>({
    total_transcriptions: 0,
    total_analytics: 0,
    forbidden_word_violations: 0,
    high_risk_calls: 0,
    positive_sentiment_calls: 0,
    last_call_date: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<CallTranscription | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { query, transaction } = createClient()

  useEffect(() => {
    fetchRealData()
  }, [])



  const fetchRealData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching real call analytics data...')
      
      // Fetch transcriptions
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('call_transcriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (transcriptError) {
        console.error('❌ Transcription fetch error:', transcriptError)
        
        // Log error and throw - no fallback data
        console.error('Database connection failed:', transcriptError.message)
        
        throw new Error(`Transcription fetch failed: ${transcriptError.message}`)
      }

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('call_analytics')
        .select('*')
        .order('created_at', { ascending: false })

      if (analyticsError) {
        console.error('❌ Analytics fetch error:', analyticsError)
        
        // Log error and throw - no fallback data
        console.error('Database connection failed:', analyticsError.message)
        
        throw new Error(`Analytics fetch failed: ${analyticsError.message}`)
      }

      console.log(`✅ Loaded ${transcriptData?.length || 0} transcriptions, ${analyticsData?.length || 0} analytics`)

      // Set data with proper typing
      setTranscriptions((transcriptData || []) as unknown as CallTranscription[])
      setAnalytics((analyticsData || []) as unknown as CallAnalytics[])

      // Calculate summary
      const totalTranscriptions = transcriptData?.length || 0
      const totalAnalytics = analyticsData?.length || 0
      const forbiddenWordViolations = analyticsData?.filter((a: any) => 
        a.forbidden_words_detected && Array.isArray(a.forbidden_words_detected) && a.forbidden_words_detected.length > 0
      ).length || 0
      const highRiskCalls = analyticsData?.filter((a: any) => a.risk_level === 'high').length || 0
      const positiveCalls = analyticsData?.filter((a: any) => a.overall_sentiment === 'positive').length || 0

      setSummary({
        total_transcriptions: totalTranscriptions,
        total_analytics: totalAnalytics,
        forbidden_word_violations: forbiddenWordViolations,
        high_risk_calls: highRiskCalls,
        positive_sentiment_calls: positiveCalls,
        last_call_date: (transcriptData?.[0]?.created_at as string) || null
      })

    } catch (err) {
      console.error('❌ Failed to fetch real data:', err)
      
      // Log error for production debugging
      console.error('Critical database error:', err instanceof Error ? err.message : 'Unknown error')
      
      setError(err instanceof Error ? err.message : 'Failed to fetch real data')
    } finally {
      setLoading(false)
    }
  }

  const getAnalyticsForCall = (callId: string) => {
    return analytics.find(a => a.call_id === callId)
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200'
      case 'negative': return 'bg-red-100 text-red-800 border-red-200'
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold">Loading Real Call Analytics Data...</p>
          <p className="text-sm text-gray-600 mt-2">Fetching your Large V3 transcription results</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error loading real data:</strong> {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRealData}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 AI Call Analytics Dashboard</h1>
          <p className="text-gray-600">AI-powered call transcription analysis and business insights</p>
        </div>
        <Button onClick={fetchRealData} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Real Data
            </>
          )}
        </Button>
      </div>

      {/* Data Status */}
      {summary.total_transcriptions === 0 ? (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>No call data found.</strong> Upload call recordings or process transcripts using your Large V3 system to see analytics here.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Real data loaded successfully!</strong> Showing {summary.total_transcriptions} transcriptions and {summary.total_analytics} analytics from your Large V3 system.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards - Real Data Only */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileAudio className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Transcriptions</p>
                <p className="text-2xl font-bold">{summary.total_transcriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">AI Analytics</p>
                <p className="text-2xl font-bold">{summary.total_analytics}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Positive Calls</p>
                <p className="text-2xl font-bold">{summary.positive_sentiment_calls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold">{summary.high_risk_calls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MicOff className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Compliance Issues</p>
                <p className="text-2xl font-bold">{summary.forbidden_word_violations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Last Call</p>
                <p className="text-xs font-bold">
                  {summary.last_call_date ? new Date(summary.last_call_date).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Real Call Data from Large V3 System</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcriptions">Transcriptions ({transcriptions.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics ({analytics.length})</TabsTrigger>
              <TabsTrigger value="insights">Business Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Recent Calls */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Calls</h3>
                  <div className="space-y-4">
                    {transcriptions.slice(0, 5).map((call) => {
                      const callAnalytics = getAnalyticsForCall(call.call_id)
                      return (
                        <Card key={call.id} className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setSelectedCall(call)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Phone className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{call.client_name}</h4>
                                  <p className="text-sm text-gray-600">{call.sales_agent} • {call.phone_number}</p>
                                  <p className="text-xs text-gray-500">
                                    {Math.floor(call.duration / 60)}m {call.duration % 60}s • 
                                    {new Date(call.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-blue-100 text-blue-800">
                                  {(call.confidence_score * 100).toFixed(0)}% confidence
                                </Badge>
                                {callAnalytics && (
                                  <>
                                    <Badge className={getSentimentColor(callAnalytics.overall_sentiment)}>
                                      {callAnalytics.overall_sentiment}
                                    </Badge>
                                    <Badge className={getRiskColor(callAnalytics.risk_level)}>
                                      {callAnalytics.risk_level} risk
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transcriptions">
              <div className="space-y-4">
                {transcriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transcriptions available</p>
                    <p className="text-sm text-gray-500 mt-2">Upload call recordings to generate transcriptions</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transcriptions.map((transcript) => (
                        <TableRow key={transcript.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transcript.client_name}</div>
                              <div className="text-sm text-gray-600">{transcript.phone_number}</div>
                            </div>
                          </TableCell>
                          <TableCell>{transcript.sales_agent}</TableCell>
                          <TableCell>
                            {Math.floor(transcript.duration / 60)}m {transcript.duration % 60}s
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">
                              {(transcript.confidence_score * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(transcript.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCall(transcript)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-4">
                {analytics.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No analytics available</p>
                    <p className="text-sm text-gray-500 mt-2">Process transcriptions to generate AI analytics</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {analytics.map((analytic) => {
                      const transcript = transcriptions.find(t => t.call_id === analytic.call_id)
                      return (
                        <Card key={analytic.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                {transcript?.client_name || 'Unknown Client'}
                              </CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge className={getSentimentColor(analytic.overall_sentiment)}>
                                  {analytic.overall_sentiment}
                                </Badge>
                                <Badge className={getRiskColor(analytic.risk_level)}>
                                  {analytic.risk_level} risk
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold">
                                  {analytic.agent_performance.professionalism_score}/10
                                </div>
                                <div className="text-sm text-gray-600">Professionalism</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold">
                                  {analytic.call_quality_score}/10
                                </div>
                                <div className="text-sm text-gray-600">Call Quality</div>
                              </div>
                              <div className="text-center">
                                <Badge className={getEngagementColor(analytic.client_behavior.engagement_level)}>
                                  {analytic.client_behavior.engagement_level}
                                </Badge>
                                <div className="text-sm text-gray-600 mt-1">Engagement</div>
                              </div>
                              <div className="text-center">
                                <Badge className={getEngagementColor(analytic.client_behavior.interest_level)}>
                                  {analytic.client_behavior.interest_level}
                                </Badge>
                                <div className="text-sm text-gray-600 mt-1">Interest</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {analytic.quote_discussed && (
                                <Badge className="bg-green-100 text-green-800">Quote Discussed</Badge>
                              )}
                              {analytic.budget_mentioned && (
                                <Badge className="bg-blue-100 text-blue-800">Budget Mentioned</Badge>
                              )}
                              {analytic.timeline_discussed && (
                                <Badge className="bg-purple-100 text-purple-800">Timeline Discussed</Badge>
                              )}
                              {analytic.next_steps_agreed && (
                                <Badge className="bg-orange-100 text-orange-800">Next Steps Agreed</Badge>
                              )}
                            </div>

                            {analytic.key_topics.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-semibold mb-2">Key Topics:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {analytic.key_topics.map((topic, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 pt-4 border-t">
                              Call ID: {analytic.call_id} • Analyzed: {new Date(analytic.created_at).toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Average Sentiment Score</span>
                        <span className="font-bold">
                          {analytics.length > 0 
                            ? (analytics.reduce((acc, a) => acc + a.sentiment_score, 0) / analytics.length).toFixed(2)
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Average Call Quality</span>
                        <span className="font-bold">
                          {analytics.length > 0 
                            ? (analytics.reduce((acc, a) => acc + a.call_quality_score, 0) / analytics.length).toFixed(1)
                            : 'N/A'
                          }/10
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Quote Discussion Rate</span>
                        <span className="font-bold">
                          {analytics.length > 0 
                            ? ((analytics.filter(a => a.quote_discussed).length / analytics.length) * 100).toFixed(0)
                            : 0
                          }%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>High Risk Calls</span>
                        <Badge className="bg-red-100 text-red-800">
                          {summary.high_risk_calls}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Compliance Violations</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          {summary.forbidden_word_violations}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Follow-up Required</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {analytics.filter(a => a.follow_up_required).length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Call Detail Dialog */}
      {selectedCall && (
        <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Call Details - {selectedCall.client_name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Call Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agent</p>
                  <p className="text-lg">{selectedCall.sales_agent}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-lg">{Math.floor(selectedCall.duration / 60)}m {selectedCall.duration % 60}s</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Confidence</p>
                  <p className="text-lg">{(selectedCall.confidence_score * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Date</p>
                  <p className="text-lg">{new Date(selectedCall.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Analytics */}
              {(() => {
                const callAnalytics = getAnalyticsForCall(selectedCall.call_id)
                return callAnalytics ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">AI Analytics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <Badge className={getSentimentColor(callAnalytics.overall_sentiment)}>
                          {callAnalytics.overall_sentiment}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">Sentiment</p>
                      </div>
                      <div className="text-center">
                        <Badge className={getRiskColor(callAnalytics.risk_level)}>
                          {callAnalytics.risk_level}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">Risk Level</p>
                      </div>
                      <div className="text-center">
                        <span className="text-lg font-bold">{callAnalytics.call_quality_score}/10</span>
                        <p className="text-sm text-gray-600">Quality Score</p>
                      </div>
                      <div className="text-center">
                        <span className="text-lg font-bold">{callAnalytics.agent_performance.professionalism_score}/10</span>
                        <p className="text-sm text-gray-600">Professionalism</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No analytics available for this call</p>
                  </div>
                )
              })()}

              {/* Transcript */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Call Transcript</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{selectedCall.transcript}</pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}