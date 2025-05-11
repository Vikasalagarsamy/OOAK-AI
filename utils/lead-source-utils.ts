import { createClient } from "@/lib/supabase"

// Cache for lead sources to avoid repeated database queries
let leadSourcesCache: { id: number; name: string }[] | null = null
let cacheExpiry = 0

/**
 * Get all lead sources from the database or cache
 */
export async function getAllLeadSources() {
  const now = Date.now()

  // Return cached data if it's still valid (cache for 5 minutes)
  if (leadSourcesCache && cacheExpiry > now) {
    return leadSourcesCache
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("lead_sources").select("id, name").order("name")

    if (error) {
      console.error("Error fetching lead sources:", error)
      return []
    }

    // Update cache
    leadSourcesCache = data
    cacheExpiry = now + 5 * 60 * 1000 // 5 minutes

    return data
  } catch (error) {
    console.error("Exception fetching lead sources:", error)
    return []
  }
}

/**
 * Get lead source name by ID
 */
export async function getLeadSourceNameById(id: number): Promise<string | null> {
  const sources = await getAllLeadSources()
  const source = sources.find((s) => s.id === id)
  return source ? source.name : null
}

/**
 * Get lead source ID by name (case-insensitive)
 */
export async function getLeadSourceIdByName(name: string): Promise<number | null> {
  if (!name) return null

  const sources = await getAllLeadSources()
  const source = sources.find((s) => s.name.toLowerCase() === name.toLowerCase())
  return source ? source.id : null
}

/**
 * Resolve lead source information from either ID or name
 */
export async function resolveLeadSource(leadSourceId?: number, leadSourceName?: string) {
  // Case 1: We have an ID, get the name
  if (leadSourceId) {
    const name = await getLeadSourceNameById(leadSourceId)
    return { id: leadSourceId, name: name || leadSourceName || "Unknown" }
  }

  // Case 2: We have a name, try to get the ID
  if (leadSourceName) {
    const id = await getLeadSourceIdByName(leadSourceName)
    return { id: id || undefined, name: leadSourceName }
  }

  // Case 3: We have neither
  return { id: undefined, name: "Not specified" }
}

/**
 * Safely get lead source ID either directly or by looking up the name
 * @param sourceId - The lead source ID (if available)
 * @param sourceName - The lead source name (used as fallback)
 * @returns The resolved lead source ID or null
 */
export async function safeGetLeadSourceId(
  sourceId?: number | null,
  sourceName?: string | null,
): Promise<number | null> {
  // If we already have an ID, return it
  if (sourceId) return sourceId

  // If we have a name but no ID, look up the ID
  if (sourceName) {
    return await getLeadSourceIdByName(sourceName)
  }

  // If we have neither, return null
  return null
}
