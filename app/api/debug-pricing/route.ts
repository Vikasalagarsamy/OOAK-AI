import { NextRequest, NextResponse } from 'next/server'
import { getQuotationServices, getQuotationDeliverables } from '@/actions/quotation-data-actions'

export async function GET(request: NextRequest) {
  try {
    const [services, deliverables] = await Promise.all([
      getQuotationServices(),
      getQuotationDeliverables()
    ])

    // Get the specific services and deliverables from the quotation
    const service1 = services?.find(s => s.id === 1)
    const service3 = services?.find(s => s.id === 3)
    const deliverable2 = deliverables?.find(d => d.id === 2)
    const deliverable3 = deliverables?.find(d => d.id === 3)

    const packageType = 'basic' // From the quotation data

    const calculation = {
      services: {
        service1: {
          id: 1,
          name: service1?.name || 'Unknown',
          basic_price: service1?.basic_price || 0,
          quantity: 1,
          total: (service1?.basic_price || 0) * 1
        },
        service3: {
          id: 3,
          name: service3?.name || 'Unknown',
          basic_price: service3?.basic_price || 0,
          quantity: 1,
          total: (service3?.basic_price || 0) * 1
        }
      },
      deliverables: {
        deliverable2: {
          id: 2,
          name: deliverable2?.name || 'Unknown',
          basic_price: deliverable2?.basic_price || 0,
          quantity: 1,
          total: (deliverable2?.basic_price || 0) * 1
        },
        deliverable3: {
          id: 3,
          name: deliverable3?.name || 'Unknown',
          basic_price: deliverable3?.basic_price || 0,
          quantity: 1,
          total: (deliverable3?.basic_price || 0) * 1
        }
      },
      totals: {
        services_total: ((service1?.basic_price || 0) + (service3?.basic_price || 0)),
        deliverables_total: ((deliverable2?.basic_price || 0) + (deliverable3?.basic_price || 0)),
        grand_total: ((service1?.basic_price || 0) + (service3?.basic_price || 0) + (deliverable2?.basic_price || 0) + (deliverable3?.basic_price || 0))
      },
      expected_vs_actual: {
        expected_total: 43500,
        calculated_total: ((service1?.basic_price || 0) + (service3?.basic_price || 0) + (deliverable2?.basic_price || 0) + (deliverable3?.basic_price || 0)),
        stored_total: 23000,
        difference: 43500 - ((service1?.basic_price || 0) + (service3?.basic_price || 0) + (deliverable2?.basic_price || 0) + (deliverable3?.basic_price || 0))
      }
    }

    return NextResponse.json({
      success: true,
      calculation
    })
  } catch (error) {
    console.error('❌ Error debugging pricing:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 