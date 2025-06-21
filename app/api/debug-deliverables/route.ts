import { NextRequest, NextResponse } from 'next/server'
import { getQuotationDeliverables } from '@/actions/quotation-data-actions'

export async function GET(request: NextRequest) {
  try {
    const deliverables = await getQuotationDeliverables()

    return NextResponse.json({
      success: true,
      count: deliverables?.length || 0,
      deliverables: deliverables?.map(d => ({
        id: d.id,
        name: d.deliverable_name,
        category: d.is_main_deliverable ? 'Main' : 'Optional',
        type: d.service_category,
        basic_price: d.basic_total_price,
        premium_price: d.premium_total_price,
        elite_price: d.elite_total_price,
        typical_events: d.typical_events
      })) || []
    })
  } catch (error) {
    console.error('❌ Error getting deliverables:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 