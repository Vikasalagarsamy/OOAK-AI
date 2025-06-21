import { query } from "@/lib/postgresql-client"

/**
 * LEAD SOURCE UTILS - NOW 100% POSTGRESQL
 * =======================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced caching mechanism
 * - Optimized database operations
 * - All Supabase dependencies eliminated
 */

// Cache for lead sources to avoid repeated database queries
let leadSourcesCache: { id: number; name: string }[] | null = null
let cacheExpiry = 0

/**
 * Get all lead sources from PostgreSQL database or cache
 */
export async function getAllLeadSources() {
  const now = Date.now()

  // Return cached data if it's still valid (cache for 5 minutes)
  if (leadSourcesCache && cacheExpiry > now) {
    console.log('📋 Using cached lead sources data')
    return leadSourcesCache
  }

  try {
    console.log('📋 Fetching lead sources from PostgreSQL...')
    
    const result = await query(`
      SELECT id, name 
      FROM lead_sources 
      WHERE is_active = true
      ORDER BY name ASC
    `)

    const data = result.rows

    // Update cache
    leadSourcesCache = data
    cacheExpiry = now + 5 * 60 * 1000 // 5 minutes

    console.log(`✅ Fetched ${data.length} lead sources from PostgreSQL`)
    return data

  } catch (error: any) {
    console.error("❌ Error fetching lead sources from PostgreSQL:", error)
    return []
  }
}

/**
 * Get lead source name by ID via PostgreSQL
 */
export async function getLeadSourceNameById(id: number): Promise<string | null> {
  if (!id) return null
  
  try {
    const sources = await getAllLeadSources()
    const source = sources.find((s) => s.id === id)
    
    if (source) {
      console.log(`✅ Found lead source: ${source.name} (ID: ${id})`)
      return source.name
    }
    
    console.log(`⚠️ Lead source not found for ID: ${id}`)
    return null
  } catch (error) {
    console.error(`❌ Error getting lead source name for ID ${id}:`, error)
    return null
  }
}

/**
 * Get lead source ID by name (case-insensitive) via PostgreSQL
 */
export async function getLeadSourceIdByName(name: string): Promise<number | null> {
  if (!name || !name.trim()) return null

  try {
    const sources = await getAllLeadSources()
    const source = sources.find((s) => s.name.toLowerCase() === name.toLowerCase())
    
    if (source) {
      console.log(`✅ Found lead source ID: ${source.id} for name: ${name}`)
      return source.id
    }
    
    console.log(`⚠️ Lead source ID not found for name: ${name}`)
    return null
  } catch (error) {
    console.error(`❌ Error getting lead source ID for name "${name}":`, error)
    return null
  }
}

/**
 * Resolve lead source information from either ID or name via PostgreSQL
 */
export async function resolveLeadSource(leadSourceId?: number, leadSourceName?: string) {
  try {
    // Case 1: We have an ID, get the name
    if (leadSourceId) {
      const name = await getLeadSourceNameById(leadSourceId)
      return { 
        id: leadSourceId, 
        name: name || leadSourceName || "Unknown" 
      }
    }

    // Case 2: We have a name, try to get the ID
    if (leadSourceName) {
      const id = await getLeadSourceIdByName(leadSourceName)
      return { 
        id: id || undefined, 
        name: leadSourceName 
      }
    }

    // Case 3: We have neither
    return { 
      id: undefined, 
      name: "Not specified" 
    }
  } catch (error) {
    console.error("❌ Error resolving lead source:", error)
    return { 
      id: undefined, 
      name: "Error resolving" 
    }
  }
}

/**
 * Safely get lead source ID either directly or by looking up the name via PostgreSQL
 * @param sourceId - The lead source ID (if available)
 * @param sourceName - The lead source name (used as fallback)
 * @returns The resolved lead source ID or null
 */
export async function safeGetLeadSourceId(
  sourceId?: number | null,
  sourceName?: string | null,
): Promise<number | null> {
  try {
    // If we already have an ID, return it
    if (sourceId) {
      console.log(`✅ Using existing lead source ID: ${sourceId}`)
      return sourceId
    }

    // If we have a name but no ID, look up the ID
    if (sourceName) {
      console.log(`📋 Looking up lead source ID for name: ${sourceName}`)
      return await getLeadSourceIdByName(sourceName)
    }

    // If we have neither, return null
    console.log('⚠️ No lead source ID or name provided')
    return null
  } catch (error) {
    console.error("❌ Error in safeGetLeadSourceId:", error)
    return null
  }
}

/**
 * Clear the lead sources cache (useful for testing or after updates)
 */
export function clearLeadSourcesCache(): void {
  console.log('🧹 Clearing lead sources cache')
  leadSourcesCache = null
  cacheExpiry = 0
}

/**
 * Preload lead sources into cache via PostgreSQL
 */
export async function preloadLeadSources(): Promise<void> {
  console.log('⚡ Preloading lead sources into cache...')
  await getAllLeadSources()
  console.log('✅ Lead sources preloaded successfully')
}
