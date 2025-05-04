"use server"

import { createBasicClient } from "@/lib/supabase-client"
import type { LeadSource } from "@/types/lead-source"

/**
 * Creates a new lead source in the database
 * @param name The name of the lead source
 * @param description The description of the lead source (optional)
 */
export async function createLeadSource(name: string, description?: string): Promise<void> {
  try {
    console.log("Creating lead source:", { name, description })
    const supabase = createBasicClient()

    const { error } = await supabase.from("lead_sources").insert({
      name: name,
      description: description,
      is_active: true, // Explicitly set to true
    })

    if (error) {
      console.error("Supabase error creating lead source:", error)
      throw error
    }
  } catch (error) {
    console.error("Error creating lead source:", error)
    throw error
  }
}

/**
 * Fetches all lead sources from the database
 * @returns Array of lead sources
 */
export async function getLeadSources(): Promise<LeadSource[]> {
  try {
    const supabase = createBasicClient()

    const { data, error } = await supabase
      .from("lead_sources")
      .select("id, name, description, is_active") // Explicitly select is_active
      .order("name")

    if (error) {
      console.error("Error fetching lead sources:", error)
      return []
    }

    console.log("Lead sources fetched:", data?.length)
    return data || []
  } catch (error) {
    console.error("Error in getLeadSources:", error)
    return []
  }
}

export async function updateLeadSource(id: number, name: string, description?: string): Promise<void> {
  try {
    const supabase = createBasicClient()

    const { error } = await supabase
      .from("lead_sources")
      .update({
        name: name,
        description: description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error updating lead source:", error)
    throw error
  }
}

export async function toggleLeadSourceStatus(id: number, currentStatus: boolean): Promise<void> {
  try {
    const supabase = createBasicClient()

    const { error } = await supabase
      .from("lead_sources")
      .update({
        is_active: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error toggling lead source status:", error)
    throw error
  }
}
