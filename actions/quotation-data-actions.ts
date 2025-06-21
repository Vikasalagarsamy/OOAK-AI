"use server"

import { query } from "@/lib/postgresql-client"
import { getServicesWithPackages } from "./services-actions"
import { calculateDeliverableTotalPricing } from "./deliverables-actions"

/**
 * QUOTATION DATA ACTIONS - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized data retrieval
 * - All Supabase dependencies eliminated
 */

// Types for quotation generator
export interface QuotationServiceItem {
  id: number
  servicename: string
  basic_price: number
  premium_price: number
  elite_price: number
  category: string
  package_included: { basic: boolean; premium: boolean; elite: boolean }
  description?: string
}

export interface QuotationDeliverableItem {
  id: number
  deliverable_name: string
  basic_total_price: number
  premium_total_price: number
  elite_total_price: number
  is_main_deliverable: boolean
  typical_events: string[]
  process_count: number
  service_category: string
  description?: string
}

export interface QuotationEventType {
  id: number
  name: string
}

/**
 * Get all services formatted for quotation generator
 */
export async function getQuotationServices(): Promise<QuotationServiceItem[]> {
  try {
    console.log('📊 Fetching quotation services via PostgreSQL...')
    const services = await getServicesWithPackages()
    
    const result = services
      .filter(service => service.status?.toLowerCase() === "active")
      .map(service => ({
        id: service.id,
        servicename: service.servicename,
        basic_price: service.basic_price || 0,
        premium_price: service.premium_price || 0,
        elite_price: service.elite_price || 0,
        category: service.category || "Other",
        package_included: typeof service.package_included === 'boolean' 
          ? { basic: service.package_included, premium: service.package_included, elite: service.package_included }
          : service.package_included || { basic: false, premium: false, elite: false },
        description: service.description || undefined
      }))

    console.log(`✅ Loaded ${result.length} quotation services`)
    return result
  } catch (error) {
    console.error("❌ Error fetching quotation services:", error)
    return []
  }
}

/**
 * Get all deliverables formatted for quotation generator with total pricing
 */
export async function getQuotationDeliverables(): Promise<QuotationDeliverableItem[]> {
  try {
    console.log('📦 Fetching quotation deliverables via PostgreSQL...')
    
    // Get deliverables from the deliverables table using PostgreSQL
    const result = await query(`
      SELECT * FROM deliverables 
      WHERE status = 1 
      ORDER BY deliverable_name
    `)

    const deliverables = result.rows

    if (!deliverables || deliverables.length === 0) {
      console.log("ℹ️ No deliverables found in catalog")
      return []
    }

    // Map the deliverables to the quotation format
    const mappedDeliverables: QuotationDeliverableItem[] = deliverables.map(deliverable => {
      // Define typical events based on deliverable name patterns
      const typicalEvents = getTypicalEventsForDeliverable(deliverable.deliverable_name)
      
      return {
        id: deliverable.id,
        deliverable_name: deliverable.deliverable_name,
        basic_total_price: deliverable.basic_price || 0,
        premium_total_price: deliverable.premium_price || 0,
        elite_total_price: deliverable.elite_price || 0,
        // Also add the _price fields for compatibility with quotation calculation
        basic_price: deliverable.basic_price || 0,
        premium_price: deliverable.premium_price || 0,
        elite_price: deliverable.elite_price || 0,
        is_main_deliverable: deliverable.deliverable_cat === "Main",
        typical_events: typicalEvents,
        process_count: 1, // Default to 1 process for catalog items
        service_category: deliverable.deliverable_type === "Photo" ? "Photography" : "Videography",
        description: deliverable.description || undefined
      } as any
    })

    console.log(`✅ Loaded ${mappedDeliverables.length} deliverables for quotation`)
    return mappedDeliverables
  } catch (error) {
    console.error("❌ Error fetching quotation deliverables:", error)
    return []
  }
}

/**
 * Get event types formatted for quotation generator
 */
export async function getQuotationEventTypes(): Promise<QuotationEventType[]> {
  try {
    console.log('🎉 Fetching quotation event types via PostgreSQL...')
    
    const result = await query(`
      SELECT * FROM events 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `)

    const events = result.rows
    
    const mappedEvents = (events || []).map(event => ({
      id: parseInt(event.event_id?.replace(/\D/g, '') || '0') || Math.floor(Math.random() * 1000),
      name: event.name
    }))

    console.log(`✅ Loaded ${mappedEvents.length} event types`)
    return mappedEvents
  } catch (error) {
    console.error("❌ Error fetching quotation event types:", error)
    return []
  }
}

/**
 * Helper function to determine typical events for a deliverable
 */
function getTypicalEventsForDeliverable(deliverableName: string): string[] {
  const name = deliverableName.toLowerCase()
  
  // Wedding-related deliverables
  if (name.includes('album') || name.includes('wedding') || name.includes('bridal')) {
    return ["Wedding Photography", "Reception Photography"]
  }
  
  // Photo-related deliverables
  if (name.includes('photo') || name.includes('picture') || name.includes('gallery') || name.includes('print')) {
    return ["Wedding Photography", "Pre-Wedding Shoot", "Reception Photography"]
  }
  
  // Video-related deliverables
  if (name.includes('video') || name.includes('film') || name.includes('highlight') || name.includes('edit')) {
    return ["Wedding Photography", "Reception Photography"]
  }
  
  // Corporate deliverables
  if (name.includes('corporate') || name.includes('business') || name.includes('conference')) {
    return ["Corporate Event"]
  }
  
  // Engagement deliverables
  if (name.includes('engagement') || name.includes('booth')) {
    return ["Engagement Ceremony"]
  }
  
  // General deliverables
  return ["Wedding Photography", "Pre-Wedding Shoot"]
}

/**
 * Get all quotation data in a single call for performance
 */
export async function getQuotationData(): Promise<{
  services: QuotationServiceItem[]
  deliverables: QuotationDeliverableItem[]
  eventTypes: QuotationEventType[]
}> {
  try {
    console.log('🚀 Fetching all quotation data via PostgreSQL (parallel operations)...')
    
    const [services, deliverables, eventTypes] = await Promise.all([
      getQuotationServices(),
      getQuotationDeliverables(),
      getQuotationEventTypes()
    ])

    console.log('✅ All quotation data loaded successfully')
    return {
      services,
      deliverables,
      eventTypes
    }
  } catch (error) {
    console.error("❌ Error fetching quotation data:", error)
    return {
      services: [],
      deliverables: [],
      eventTypes: []
    }
  }
}