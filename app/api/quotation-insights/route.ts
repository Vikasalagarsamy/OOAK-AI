import { NextRequest, NextResponse } from 'next/server'
import { getQuotationInsights, analyzeClientCommunication } from '@/actions/ai-communication-analysis'
import { getCurrentUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quotationId = searchParams.get('quotationId')
    
    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID required' }, { status: 400 })
    }

    console.log(`🔍 Getting AI insights for quotation ${quotationId}`)

    const result = await getQuotationInsights(parseInt(quotationId))
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        insights: result.insights,
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: currentUser.employeeId
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error getting quotation insights:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get quotation insights'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quotationId, action } = await request.json()
    
    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID required' }, { status: 400 })
    }

    console.log(`🧠 Processing AI action "${action}" for quotation ${quotationId}`)

    if (action === 'analyze') {
      // Trigger AI analysis for the quotation
      const result = await analyzeClientCommunication(parseInt(quotationId))
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          insights: result.insights,
          message: 'AI analysis completed successfully'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Error processing AI action:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process AI action'
    }, { status: 500 })
  }
} 