import { NextRequest, NextResponse } from 'next/server'
import { recalculateQuotationTotals } from '@/actions/quotations-actions'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting quotation totals fix...')
    
    const result = await recalculateQuotationTotals()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${result.updated} quotations`,
        updated: result.updated
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error fixing quotation totals:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to fix quotation totals',
    endpoint: '/api/fix-quotation-totals',
    method: 'POST'
  })
} 