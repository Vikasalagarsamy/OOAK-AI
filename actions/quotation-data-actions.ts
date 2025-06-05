"use server"

import { createClient } from "@/lib/supabase/server"
import { getServicesWithPackages } from "./services-actions"
import { calculateDeliverableTotalPricing } from "./deliverables-actions"

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
    const services = await getServicesWithPackages()
    
    return services
      .filter(service => service.status === "Active")
      .map(service => ({
        id: service.id,
        servicename: service.servicename,
        basic_price: service.basic_price || 0,
        premium_price: service.premium_price || 0,
        elite_price: service.elite_price || 0,
        category: service.category || "Other",
        package_included: service.package_included || { basic: false, premium: false, elite: false },
        description: service.description || undefined
      }))
  } catch (error) {
    console.error("Error fetching quotation services:", error)
    return []
  }
}

/**
 * Get all deliverables formatted for quotation generator with total pricing
 */
export async function getQuotationDeliverables(): Promise<QuotationDeliverableItem[]> {
  const supabase = createClient()
  
  try {
    // Get unique deliverable names with their metadata
    const { data: deliverables, error } = await supabase
      .from("deliverables")
      .select(`
        deliverable_name,
        deliverable_cat,
        deliverable_type,
        stage
      `)
      .eq("status", 1)
      .order("deliverable_name")

    if (error) {
      console.error("Error fetching deliverables:", error)
      return []
    }

    // Group by deliverable name and calculate totals
    const deliverableMap = new Map<string, any>()
    
    for (const deliverable of deliverables || []) {
      if (!deliverableMap.has(deliverable.deliverable_name)) {
        deliverableMap.set(deliverable.deliverable_name, {
          deliverable_name: deliverable.deliverable_name,
          is_main_deliverable: deliverable.deliverable_cat === "Main",
          service_category: deliverable.deliverable_type === "Photo" ? "Photography" : "Videography",
          typical_events: [], // We'll populate this based on common usage patterns
        })
      }
    }

    // Calculate pricing for each unique deliverable
    const result: QuotationDeliverableItem[] = []
    let id = 1

    for (const [deliverableName, deliverableInfo] of deliverableMap) {
      try {
        const pricing = await calculateDeliverableTotalPricing(deliverableName)
        
        // Define typical events based on deliverable name patterns
        const typicalEvents = getTypicalEventsForDeliverable(deliverableName)
        
        result.push({
          id: id++,
          deliverable_name: deliverableName,
          basic_total_price: pricing.basic_total,
          premium_total_price: pricing.premium_total,
          elite_total_price: pricing.elite_total,
          is_main_deliverable: deliverableInfo.is_main_deliverable,
          typical_events: typicalEvents,
          process_count: pricing.process_count,
          service_category: deliverableInfo.service_category,
          description: undefined
        })
      } catch (error) {
        console.error(`Error calculating pricing for ${deliverableName}:`, error)
        // Skip this deliverable if pricing calculation fails
      }
    }

    return result
  } catch (error) {
    console.error("Error fetching quotation deliverables:", error)
    return []
  }
}

/**
 * Get event types formatted for quotation generator
 */
export async function getQuotationEventTypes(): Promise<QuotationEventType[]> {
  const supabase = createClient()
  
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching events:", error)
      return []
    }
    
    return (events || []).map(event => ({
      id: parseInt(event.event_id?.replace(/\D/g, '') || '0') || Math.floor(Math.random() * 1000),
      name: event.name
    }))
  } catch (error) {
    console.error("Error fetching quotation event types:", error)
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
    const [services, deliverables, eventTypes] = await Promise.all([
      getQuotationServices(),
      getQuotationDeliverables(),
      getQuotationEventTypes()
    ])

    return {
      services,
      deliverables,
      eventTypes
    }
  } catch (error) {
    console.error("Error fetching quotation data:", error)
    return {
      services: [],
      deliverables: [],
      eventTypes: []
    }
  }
} 