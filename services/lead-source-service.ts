"use server"

import { query, transaction } from "@/lib/postgresql-client"

export interface LeadSource {
  id?: number
  name: string
  description?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Creates a new lead source in the database
 * @param source The lead source object without id, created_at, and updated_at
 */
export async function createLeadSource(source: Omit<LeadSource, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('📝 Creating lead source via PostgreSQL:', source.name)

    const result = await query(`
      INSERT INTO lead_sources (name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `, [
      source.name,
      source.description || null,
      source.is_active !== false
    ])

    console.log('✅ Lead source created successfully via PostgreSQL')

    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error creating lead source (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Fetches all lead sources from the database
 * @returns Array of lead sources
 */
export async function getLeadSources() {
  try {
    console.log('📝 Fetching lead sources via PostgreSQL...')

    const result = await query(`
      SELECT *
      FROM lead_sources
      WHERE is_active = true
      ORDER BY name
    `)

    console.log('✅ Lead sources fetched successfully via PostgreSQL')

    return {
      success: true,
      data: result.rows
    }
  } catch (error) {
    console.error("Error fetching lead sources (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

export async function getLeadSourceById(id: number) {
  try {
    console.log('📝 Fetching lead source by ID via PostgreSQL:', id)

    const result = await query(`
      SELECT *
      FROM lead_sources
      WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Lead source not found"
      }
    }

    console.log('✅ Lead source fetched successfully via PostgreSQL')

    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error fetching lead source by ID (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Updates a lead source in the database
 * @param id The ID of the lead source to update
 * @param updates The partial lead source object containing the updates
 */
export async function updateLeadSource(id: number, updates: Partial<LeadSource>) {
  try {
    console.log('📝 Updating lead source via PostgreSQL:', id)

    const setClause = []
    const params = []
    let paramCount = 0

    if (updates.name) {
      paramCount++
      setClause.push(`name = $${paramCount}`)
      params.push(updates.name)
    }

    if (updates.description !== undefined) {
      paramCount++
      setClause.push(`description = $${paramCount}`)
      params.push(updates.description)
    }

    if (updates.is_active !== undefined) {
      paramCount++
      setClause.push(`is_active = $${paramCount}`)
      params.push(updates.is_active)
    }

    paramCount++
    setClause.push(`updated_at = NOW()`)

    paramCount++
    params.push(id)

    const result = await query(`
      UPDATE lead_sources 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params)

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Lead source not found"
      }
    }

    console.log('✅ Lead source updated successfully via PostgreSQL')

    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error updating lead source (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Deletes a lead source from the database
 * @param id The ID of the lead source to delete
 */
export async function deleteLeadSource(id: number) {
  try {
    console.log('📝 Deleting lead source via PostgreSQL:', id)

    const result = await query(`
      UPDATE lead_sources 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Lead source not found"
      }
    }

    console.log('✅ Lead source deleted successfully via PostgreSQL')

    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error deleting lead source (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getLeadSourceStats() {
  try {
    console.log('📝 Fetching lead source stats via PostgreSQL...')

    const result = await query(`
      SELECT 
        ls.id,
        ls.name,
        COUNT(l.id) as leads_count,
        COUNT(CASE WHEN l.status = 'CONVERTED' THEN 1 END) as conversions,
        COALESCE(SUM(l.expected_value), 0) as total_value
      FROM lead_sources ls
      LEFT JOIN leads l ON ls.id = l.lead_source_id
      WHERE ls.is_active = true
      GROUP BY ls.id, ls.name
      ORDER BY leads_count DESC
    `)

    console.log('✅ Lead source stats fetched successfully via PostgreSQL')

    return {
      success: true,
      data: result.rows
    }
  } catch (error) {
    console.error("Error fetching lead source stats (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}
