"use server"

import { createClient } from "@/lib/supabase"
import type { LeadSource } from "@/types/lead-source"

/**
 * Creates a new lead source in the database
 * @param name The name of the lead source
 * @param description The description of the lead source (optional)
 */
export async function createLeadSource(name: string, description?: string): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("lead_sources").insert({
      name: name,
      description: description,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error creating lead source:", error)
    throw error // Re-throw to be handled by the caller
  }
}

/**
 * Fetches all active lead sources from the database
 * @returns Array of lead sources
 */
export async function getLeadSources(): Promise<LeadSource[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("lead_sources").select("*").order("name")

    if (error) {
      console.error("Error fetching lead sources:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getLeadSources:", error)
    return []
  }
}
