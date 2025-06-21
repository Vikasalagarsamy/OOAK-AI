'use server'

import { query } from '@/lib/postgresql-client'
import { createProtectedAction } from '@/lib/auth-utils'

export interface LeadSource {
  id: number
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 📋 Get all lead sources
export const getLeadSources = createProtectedAction(async () => {
  console.log('🎯 Fetching all lead sources...')
  
  try {
    const result = await query(
      'SELECT * FROM lead_sources ORDER BY name ASC'
    )

    console.log(`✅ Retrieved ${result.rows.length} lead sources`)
    return {
      success: true,
      data: result.rows as LeadSource[]
    }

  } catch (error) {
    console.error('❌ Error fetching lead sources:', error)
    return {
      success: false,
      error: 'Failed to fetch lead sources'
    }
  }
})

// 📋 Get active lead sources only
export const getActiveLeadSources = createProtectedAction(async () => {
  console.log('🎯 Fetching active lead sources...')
  
  try {
    const result = await query(
      'SELECT * FROM lead_sources WHERE is_active = true ORDER BY name ASC'
    )

    console.log(`✅ Retrieved ${result.rows.length} active lead sources`)
    return {
      success: true,
      data: result.rows as LeadSource[]
    }

  } catch (error) {
    console.error('❌ Error fetching active lead sources:', error)
    return {
      success: false,
      error: 'Failed to fetch active lead sources'
    }
  }
}) 