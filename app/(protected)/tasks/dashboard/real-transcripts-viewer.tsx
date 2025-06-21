'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/postgresql-client-unified'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle, Eye, FileText, Shield, AlertOctagon, Download, Calendar, User, Phone } from 'lucide-react'
import { toast } from 'sonner'

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
  forbidden_words_detected: string[]
  compliance_issues: string[]
  risk_level: string
  agent_professionalism_score: number
  client_engagement_level: string
  quote_discussed: boolean
  created_at: string
}

export default function RealTranscriptsViewer() {
  const [transcriptions, setTranscriptions] = useState<CallTranscription[]>([])
  const [analytics, setAnalytics] = useState<CallAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTranscript, setSelectedTranscript] = useState<CallTranscription | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  const { query, transaction } = createClient()

  useEffect(() => {
    console.log('🚀 RealTranscriptsViewer component mounted, fetching data...')
    fetchData()
  }, [])

  // Function to format transcript into conversation lines
  const formatTranscript = (transcript: string): { speaker: string; text: string }[] => {
    if (!transcript) return []
    
    // Split by Agent: and Client: patterns
    const lines = transcript
      .split(/(?=Agent:|Client:)/)
      .filter(line => line.trim().length > 0)
    
    return lines.map(line => {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('Agent:')) {
        return {
          speaker: 'Agent',
          text: trimmedLine.replace('Agent:', '').trim()
        }
      } else if (trimmedLine.startsWith('Client:')) {
        return {
          speaker: 'Client', 
          text: trimmedLine.replace('Client:', '').trim()
        }
      } else {
        // Handle any other content as continuation
        return {
          speaker: 'Note',
          text: trimmedLine
        }
      }
    }).filter(item => item.text.length > 0)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching real call data from API...')
      
      // Use our working API endpoint to get COMPLETE real data
      const response = await fetch('/api/data/real-call-data')
      const apiData = await response.json()
      
      if (!response.ok) {
        throw new Error(apiData.error || 'Failed to fetch data')
      }
      
      console.log('✅ API Data fetched successfully:', apiData.summary)
      
      // Now use Supabase to get the FULL detailed data
      console.log('🔄 Fetching detailed transcriptions from Supabase...')
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('call_transcriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (transcriptError) {
        console.error('❌ Supabase transcription error:', transcriptError)
        // Fallback to API data if Supabase fails
        console.log('⚡ Using API fallback data')
        const fallbackTranscriptions = apiData.recent_transcriptions.map((t: any) => ({
          ...t,
          transcript: t.transcript_preview + '... [Full transcript available in database]'
        })) as CallTranscription[]
        setTranscriptions(fallbackTranscriptions)
        setAnalytics((apiData.recent_analytics || []) as unknown as CallAnalytics[])
        return
      }

      console.log('🔄 Fetching detailed analytics from Supabase...')
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('call_analytics')
        .select('*')
        .order('created_at', { ascending: false })

      if (analyticsError) {
        console.error('❌ Supabase analytics error:', analyticsError)
        // Use what we got from transcriptions and API analytics
        setTranscriptions((transcriptData || []) as unknown as CallTranscription[])
        setAnalytics((apiData.recent_analytics || []) as unknown as CallAnalytics[])
        return
      }

      const transcriptCount = transcriptData?.length || 0
      const analyticsCount = analyticsData?.length || 0
      
      console.log(`📊 SUCCESS: Loaded ${transcriptCount} transcriptions and ${analyticsCount} analytics`)
      console.log('📝 Transcription samples:', transcriptData?.slice(0, 2))
      console.log('📈 Analytics samples:', analyticsData?.slice(0, 2))

      setTranscriptions((transcriptData || []) as unknown as CallTranscription[])
      setAnalytics((analyticsData || []) as unknown as CallAnalytics[])

    } catch (err) {
      console.error('❌ Failed to fetch data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const getAnalyticsForCall = (callId: string) => {
    return analytics.find(a => a.call_id === callId)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'negative': return 'bg-red-100 text-red-800'
      case 'neutral': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const downloadTranscript = (transcript: CallTranscription) => {
    const content = `CALL TRANSCRIPT
================

Client: ${transcript.client_name}
Agent: ${transcript.sales_agent}
Phone: ${transcript.phone_number}
Duration: ${Math.floor(transcript.duration / 60)}:${(transcript.duration % 60).toString().padStart(2, '0')}
Date: ${new Date(transcript.created_at).toLocaleString()}
Confidence: ${(transcript.confidence_score * 100).toFixed(1)}%

TRANSCRIPT:
-----------
${transcript.transcript}

================
Generated by FREE Local Call Analytics System`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript_${transcript.client_name.replace(/\s+/g, '_')}_${transcript.call_id.substring(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Transcript downloaded!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transcripts and compliance data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Error loading data</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Calculate compliance metrics
  const totalCalls = transcriptions.length
  const callsWithForbiddenWords = analytics.filter(a => a.forbidden_words_detected && a.forbidden_words_detected.length > 0).length
  const highRiskCalls = analytics.filter(a => a.risk_level === 'high').length
  const complianceIssuesCount = analytics.reduce((sum, a) => sum + (a.compliance_issues?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header with Compliance Alert */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Real Call Transcripts & Compliance</h2>
          <p className="text-gray-600">
            View {transcriptions.length} real transcripts | {analytics.length} analytics | 
            {callsWithForbiddenWords > 0 && ` ${callsWithForbiddenWords} compliance violations`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
            <FileText className="h-3 w-3 mr-1" />
            {totalCalls} Transcripts
          </Badge>
          {callsWithForbiddenWords > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <AlertOctagon className="h-3 w-3 mr-1" />
              {callsWithForbiddenWords} Compliance Alerts
            </Badge>
          )}
        </div>
      </div>

      {/* Compliance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">Transcribed and analyzed</p>
          </CardContent>
        </Card>

        <Card className={callsWithForbiddenWords > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forbidden Words</CardTitle>
            <AlertOctagon className={`h-4 w-4 ${callsWithForbiddenWords > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${callsWithForbiddenWords > 0 ? 'text-red-600' : ''}`}>
              {callsWithForbiddenWords}
            </div>
            <p className="text-xs text-muted-foreground">
              {callsWithForbiddenWords > 0 ? 'Requires attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>

        <Card className={highRiskCalls > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Calls</CardTitle>
            <Shield className={`h-4 w-4 ${highRiskCalls > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${highRiskCalls > 0 ? 'text-yellow-600' : ''}`}>
              {highRiskCalls}
            </div>
            <p className="text-xs text-muted-foreground">Risk assessment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceIssuesCount}</div>
            <p className="text-xs text-muted-foreground">Total issues detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Transcripts List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">All Transcripts</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Violations</TabsTrigger>
          <TabsTrigger value="viewer">Transcript Viewer</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {transcriptions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-600 font-medium">⚠️ No real transcripts loaded yet</p>
                <p className="text-sm text-gray-500 mt-2">We know there are 7 transcriptions in the database. Debugging...</p>
                <Button 
                  onClick={fetchData} 
                  className="mt-4"
                  variant="outline"
                >
                  🔄 Reload Real Data
                </Button>
                <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs">
                  <p><strong>Debug Info:</strong></p>
                  <p>• Transcriptions: {transcriptions.length}</p>
                  <p>• Analytics: {analytics.length}</p>
                  <p>• Loading: {loading ? 'Yes' : 'No'}</p>
                  <p>• Error: {error || 'None'}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {transcriptions.map((transcript) => {
                const callAnalytics = getAnalyticsForCall(transcript.call_id)
                return (
                  <Card key={transcript.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <CardTitle className="text-lg">{transcript.client_name}</CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {transcript.sales_agent}
                              </span>
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {transcript.phone_number}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(transcript.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {(transcript.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                          {callAnalytics && (
                            <>
                              <Badge className={getSentimentColor(callAnalytics.overall_sentiment)}>
                                {callAnalytics.overall_sentiment}
                              </Badge>
                              <Badge className={getRiskColor(callAnalytics.risk_level)}>
                                {callAnalytics.risk_level} risk
                              </Badge>
                              {callAnalytics.forbidden_words_detected && callAnalytics.forbidden_words_detected.length > 0 && (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  <AlertOctagon className="h-3 w-3 mr-1" />
                                  Compliance Alert
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Duration:</span> {Math.floor(transcript.duration / 60)}:{(transcript.duration % 60).toString().padStart(2, '0')}
                        </div>
                        <div>
                          <span className="font-medium">Call ID:</span> {transcript.call_id.substring(0, 8)}...
                        </div>
                        {callAnalytics && (
                          <div>
                            <span className="font-medium">Agent Score:</span> {callAnalytics.agent_professionalism_score}/10
                          </div>
                        )}
                      </div>

                      {/* Forbidden Words Alert */}
                      {callAnalytics && callAnalytics.forbidden_words_detected && callAnalytics.forbidden_words_detected.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <AlertOctagon className="h-4 w-4 text-red-500 mr-2" />
                            <span className="font-semibold text-red-800">Compliance Violation Detected</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-red-700">Forbidden Words:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {callAnalytics.forbidden_words_detected.map((word, index) => (
                                  <Badge key={index} className="bg-red-100 text-red-800 text-xs">
                                    {word}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {callAnalytics.compliance_issues && callAnalytics.compliance_issues.length > 0 && (
                              <div>
                                <span className="text-sm font-medium text-red-700">Issues:</span>
                                <ul className="text-sm text-red-600 ml-4 mt-1">
                                  {callAnalytics.compliance_issues.map((issue, index) => (
                                    <li key={index}>• {issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Transcript Preview</span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTranscript(transcript)
                                setActiveTab("viewer")
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Full
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadTranscript(transcript)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm space-y-2">
                          {formatTranscript(
                            transcript.transcript.length > 300 
                              ? transcript.transcript.substring(0, 300) + '...' 
                              : transcript.transcript
                          ).slice(0, 3).map((line, idx) => (
                            <div key={idx} className="flex">
                              <span className={`font-semibold mr-2 min-w-12 ${
                                line.speaker === 'Agent' 
                                  ? 'text-blue-600' 
                                  : line.speaker === 'Client' 
                                  ? 'text-green-600' 
                                  : 'text-gray-500'
                              }`}>
                                {line.speaker}:
                              </span>
                              <span className="text-gray-700 flex-1">
                                {line.text}
                              </span>
                            </div>
                          ))}
                          {formatTranscript(transcript.transcript).length > 3 && (
                            <div className="text-xs text-gray-500 italic">
                              ... and {formatTranscript(transcript.transcript).length - 3} more exchanges
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertOctagon className="h-5 w-5 mr-2" />
                Compliance Violations Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {callsWithForbiddenWords === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-800 font-semibold">No compliance violations detected!</p>
                  <p className="text-green-600 text-sm mt-2">All calls are compliant with your guidelines.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">🚨 Critical: {callsWithForbiddenWords} calls contain forbidden words</h4>
                    <p className="text-red-600 text-sm">
                      Immediate review required for compliance and training purposes.
                    </p>
                  </div>
                  
                  {analytics
                    .filter(a => a.forbidden_words_detected && a.forbidden_words_detected.length > 0)
                    .map((violation, index) => {
                      const transcript = transcriptions.find(t => t.call_id === violation.call_id)
                      return (
                        <Card key={index} className="border-red-200">
                          <CardHeader>
                            <CardTitle className="text-sm">
                              {transcript?.client_name} - {transcript?.sales_agent}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium text-red-700">Forbidden Words:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {violation.forbidden_words_detected.map((word, i) => (
                                    <Badge key={i} className="bg-red-100 text-red-800">
                                      {word}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                Date: {new Date(violation.created_at).toLocaleString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewer">
          {selectedTranscript ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Full Transcript: {selectedTranscript.client_name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Agent: {selectedTranscript.sales_agent} • {new Date(selectedTranscript.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("list")}
                    >
                      ← Back to List
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadTranscript(selectedTranscript)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {formatTranscript(selectedTranscript.transcript).map((line, index) => (
                      <div key={index} className={`flex p-3 rounded-lg ${
                        line.speaker === 'Agent' 
                          ? 'bg-blue-50 border-l-4 border-blue-400' 
                          : line.speaker === 'Client' 
                          ? 'bg-green-50 border-l-4 border-green-400'
                          : 'bg-gray-50'
                      }`}>
                        <div className={`min-w-16 font-semibold text-sm mr-3 ${
                          line.speaker === 'Agent' 
                            ? 'text-blue-700' 
                            : line.speaker === 'Client' 
                            ? 'text-green-700' 
                            : 'text-gray-500'
                        }`}>
                          {line.speaker}:
                        </div>
                        <div className="text-sm text-gray-800 flex-1 leading-relaxed">
                          {line.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Confidence: {(selectedTranscript.confidence_score * 100).toFixed(1)}% • 
                  Duration: {Math.floor(selectedTranscript.duration / 60)}:{(selectedTranscript.duration % 60).toString().padStart(2, '0')} • 
                  Call ID: {selectedTranscript.call_id}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a transcript to view the full content</p>
                <p className="text-sm text-gray-500 mt-2">
                  Go to "All Transcripts" tab and click "View Full" on any transcript to see the complete conversation here.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("list")}
                  className="mt-4"
                >
                  ← Go to All Transcripts
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 