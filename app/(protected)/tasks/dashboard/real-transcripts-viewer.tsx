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
      const { data: transcriptData, error: transcriptError } = // await supabase
