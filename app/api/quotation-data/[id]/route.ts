import { NextRequest, NextResponse } from 'next/server'
import { getQuotation } from '@/actions/quotations-actions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotationResult = await getQuotation(params.id)
    
    if (!quotationResult.success || !quotationResult.quotation) {
      return NextResponse.json({
        success: false,
        error: 'Quotation not found'
      }, { status: 404 })
    }

    const quotation = quotationResult.quotation
    const quotationData = quotation.quotation_data as any

    return NextResponse.json({
      success: true,
      quotation: {
        id: quotation.id,
        quotation_number: quotation.quotation_number,
        client_name: quotation.client_name,
        stored_total: quotation.total_amount,
        default_package: quotationData?.default_package,
        events: quotationData?.events?.map((event: any) => ({
          event_name: event.event_name,
          selected_package: event.selected_package,
          selected_services: event.selected_services || [],
          selected_deliverables: event.selected_deliverables || []
        })) || [],
        global_services: quotationData?.selected_services || [],
        global_deliverables: quotationData?.selected_deliverables || []
      }
    })
  } catch (error) {
    console.error('❌ Error getting quotation data:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 