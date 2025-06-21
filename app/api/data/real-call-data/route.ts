import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client-unified'

export async function GET(request: NextRequest) {
  try {
    const { query, transaction } = createClient()

    // Fetch real transcriptions
    const { data: transcriptions, error: transcriptionError } = await supabase
      .from('call_transcriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (transcriptionError) {
      console.error('Transcription error:', transcriptionError)
      throw transcriptionError
    }

    // Fetch real analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('call_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (analyticsError) {
      console.error('Analytics error:', analyticsError)
      throw analyticsError
    }

    // Calculate summary stats
    const totalCalls = transcriptions?.length || 0
    const forbiddenWordViolations = analytics?.filter(a => 
      a.forbidden_words_detected && Array.isArray(a.forbidden_words_detected) && a.forbidden_words_detected.length > 0
    ) || []
    
    const highRiskCalls = analytics?.filter(a => a.risk_level === 'high') || []
    const positiveCalls = analytics?.filter(a => a.overall_sentiment === 'positive') || []

    return NextResponse.json({
      success: true,
      summary: {
        total_transcriptions: totalCalls,
        total_analytics: analytics?.length || 0,
        forbidden_word_violations: forbiddenWordViolations.length,
        high_risk_calls: highRiskCalls.length,
        positive_sentiment_calls: positiveCalls.length,
        last_call_date: transcriptions?.[0]?.created_at || null
      },
      recent_transcriptions: transcriptions?.map(t => ({
        id: t.id,
        call_id: t.call_id,
        client_name: t.client_name,
        sales_agent: t.sales_agent,
        phone_number: t.phone_number,
        duration: t.duration,
        confidence_score: t.confidence_score,
        transcript_preview: (t.transcript as string)?.substring(0, 200) + '...',
        created_at: t.created_at
      })) || [],
      recent_analytics: analytics?.map(a => ({
        call_id: a.call_id,
        overall_sentiment: a.overall_sentiment,
        sentiment_score: a.sentiment_score,
        forbidden_words_detected: a.forbidden_words_detected,
        compliance_issues: a.compliance_issues,
        risk_level: a.risk_level,
        agent_professionalism_score: a.agent_professionalism_score,
        quote_discussed: a.quote_discussed,
        next_steps_agreed: a.next_steps_agreed,
        created_at: a.created_at
      })) || [],
      forbidden_word_violations: forbiddenWordViolations.map(v => ({
        call_id: v.call_id,
        forbidden_words: v.forbidden_words_detected,
        risk_level: v.risk_level,
        compliance_issues: v.compliance_issues,
        created_at: v.created_at
      }))
    })

  } catch (error) {
    console.error('❌ Error fetching real data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch real data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 