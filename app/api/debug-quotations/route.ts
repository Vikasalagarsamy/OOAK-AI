import { NextRequest, NextResponse } from 'next/server'
import { getQuotations } from '@/actions/quotations-actions'
import { getQuotationServices, getQuotationDeliverables } from '@/actions/quotation-data-actions'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging quotations...')
    
    // Get all quotations
    const quotationsResult = await getQuotations()
    
    if (!quotationsResult.success) {
      return NextResponse.json({
        success: false,
        error: quotationsResult.error
      }, { status: 500 })
    }

    const quotations = quotationsResult.quotations || []
    
    // Get services and deliverables for calculation
    const [services, deliverables] = await Promise.all([
      getQuotationServices(),
      getQuotationDeliverables()
    ])

    const debug = {
      totalQuotations: quotations.length,
      servicesCount: services?.length || 0,
      deliverablesCount: deliverables?.length || 0,
      quotations: quotations.map(q => {
        const quotationData = q.quotation_data as any
        
        // Calculate what the total should be
        let calculatedTotal = 0
        if (quotationData?.events) {
          for (const event of quotationData.events) {
            const packageType = event.selected_package === "default" ? quotationData.default_package : event.selected_package
            
            // Services
            const eventServices = event.selected_services?.length > 0 ? event.selected_services : quotationData.selected_services || []
            const servicesTotal = eventServices.reduce((sum: number, serviceItem: any) => {
              const service = services?.find((s: any) => s.id === serviceItem.id)
              if (!service) return sum
              const priceKey = `${packageType}_price`
              const basePrice = (service as any)[priceKey] || 0
              return sum + (basePrice * serviceItem.quantity)
            }, 0)

            // Deliverables
            const eventDeliverables = event.selected_deliverables?.length > 0 ? event.selected_deliverables : quotationData.selected_deliverables || []
            const deliverablesTotal = eventDeliverables.reduce((sum: number, deliverableItem: any) => {
              const deliverable = deliverables?.find((d: any) => d.id === deliverableItem.id)
              if (!deliverable) return sum
              const priceKey = `${packageType}_price`
              const basePrice = (deliverable as any)[priceKey] || 0
              return sum + (basePrice * deliverableItem.quantity)
            }, 0)

            calculatedTotal += servicesTotal + deliverablesTotal
          }
        }

        return {
          id: q.id,
          quotation_number: q.quotation_number,
          client_name: q.client_name,
          stored_total: q.total_amount,
          calculated_total: calculatedTotal,
          difference: calculatedTotal - q.total_amount,
          needs_update: Math.abs(calculatedTotal - q.total_amount) > 0.01,
          events_count: quotationData?.events?.length || 0,
          services_count: quotationData?.selected_services?.length || 0,
          deliverables_count: quotationData?.selected_deliverables?.length || 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      debug
    })
  } catch (error) {
    console.error('❌ Error debugging quotations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 