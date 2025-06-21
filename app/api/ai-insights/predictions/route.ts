import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { AIMLService } from '@/lib/ai-ml-service'
import { createClient } from '@/lib/postgresql-client'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quotation_id } = body

    if (!quotation_id) {
      return NextResponse.json({ error: 'Quotation ID required' }, { status: 400 })
    }

    // Get quotation data
    const { query, transaction } = createClient()
    const { data: quotation, error } = await supabase
      .from('saved_quotations')
      .select('*')
      .eq('id', quotation_id)
      .single()

    if (error || !quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // Generate AI predictions
    const prediction = await AIMLService.predictQuotationSuccess(quotation)
    const recommendations = await AIMLService.generateActionRecommendations(quotation)
    const clientInsights = await AIMLService.analyzeClientInsights(quotation)

    return NextResponse.json({
      success: true,
      quotation_id,
      prediction,
      recommendations,
      client_insights: clientInsights
    })

  } catch (error) {
    console.error('Error generating AI predictions:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI predictions' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quotationId = searchParams.get('quotation_id')

    const { query, transaction } = createClient()

    // Get existing predictions
    const { data: predictions } = await supabase
      .from('quotation_predictions')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('predicted_at', { ascending: false })
      .limit(1)

    // Get recommendations
    const { data: recommendations } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('quotation_id', quotationId)
      .eq('is_completed', false)
      .order('priority', { ascending: false })

    // Get recent quotations for analysis
    const { data: quotations, error: quotationsError } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      predictions: predictions || [],
      recommendations: recommendations || [],
      quotations: quotations || []
    })

  } catch (error) {
    console.error('Error fetching AI predictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI predictions' },
      { status: 500 }
    )
  }
} 