'use server'

import { query, transaction } from '@/lib/postgresql-client'
import { createProtectedAction } from '@/lib/auth-utils'
import { broadcastActivity } from '@/lib/server-sent-events'
import { revalidatePath } from 'next/cache'

// Types
export interface Vendor {
  id: number
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreateVendorData {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  status?: 'active' | 'inactive'
}

export interface UpdateVendorData {
  name?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  status?: 'active' | 'inactive'
}

// 📋 Get all vendors
export const getVendors = createProtectedAction(async () => {
  console.log('🏪 Fetching all vendors...')
  
  try {
    const result = await query(
      'SELECT * FROM vendors ORDER BY name ASC'
    )

    console.log(`✅ Retrieved ${result.rows.length} vendors`)
    return {
      success: true,
      data: result.rows as Vendor[]
    }

  } catch (error) {
    console.error('❌ Error fetching vendors:', error)
    return {
      success: false,
      error: 'Failed to fetch vendors'
    }
  }
})

// 📋 Get active vendors only
export const getActiveVendors = createProtectedAction(async () => {
  console.log('🏪 Fetching active vendors...')
  
  try {
    const result = await query(
      'SELECT * FROM vendors WHERE status = $1 ORDER BY name ASC',
      ['active']
    )

    console.log(`✅ Retrieved ${result.rows.length} active vendors`)
    return {
      success: true,
      data: result.rows as Vendor[]
    }

  } catch (error) {
    console.error('❌ Error fetching active vendors:', error)
    return {
      success: false,
      error: 'Failed to fetch active vendors'
    }
  }
})

// 📋 Get vendor by ID
export const getVendor = createProtectedAction(async (id: number) => {
  console.log(`🏪 Fetching vendor with ID: ${id}`)
  
  try {
    const result = await query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Vendor not found'
      }
    }

    console.log(`✅ Retrieved vendor: ${result.rows[0].name}`)
    return {
      success: true,
      data: result.rows[0] as Vendor
    }

  } catch (error) {
    console.error('❌ Error fetching vendor:', error)
    return {
      success: false,
      error: 'Failed to fetch vendor'
    }
  }
})

// 📋 Get vendors by category
export const getVendorsByCategory = createProtectedAction(async (category: string) => {
  console.log(`🏪 Fetching vendors by category: ${category}`)
  
  try {
    const result = await query(
      'SELECT * FROM vendors WHERE category = $1 AND status = $2 ORDER BY name ASC',
      [category, 'active']
    )

    console.log(`✅ Retrieved ${result.rows.length} vendors in category: ${category}`)
    return {
      success: true,
      data: result.rows as Vendor[]
    }

  } catch (error) {
    console.error('❌ Error fetching vendors by category:', error)
    return {
      success: false,
      error: 'Failed to fetch vendors by category'
    }
  }
})

// ➕ Create new vendor
export const createVendor = createProtectedAction(async (vendorData: CreateVendorData, user: any) => {
  console.log(`🏪 Creating new vendor: ${vendorData.name}`)
  
  try {
    // Check if vendor name already exists
    const existingResult = await query(
      'SELECT id FROM vendors WHERE LOWER(name) = LOWER($1)',
      [vendorData.name]
    )

    if (existingResult.rows.length > 0) {
      return {
        success: false,
        error: 'Vendor with this name already exists'
      }
    }

    // Create vendor
    const result = await query(
      `INSERT INTO vendors (name, contact_person, email, phone, address, category, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        vendorData.name,
        vendorData.contact_person || null,
        vendorData.email || null,
        vendorData.phone || null,
        vendorData.address || null,
        vendorData.category || null,
        vendorData.status || 'active'
      ]
    )

    const newVendor = result.rows[0] as Vendor

    // Log activity
    await query(
      `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        user.id,
        user.name,
        'CREATE',
        'vendor',
        newVendor.id,
        `Created vendor: ${newVendor.name}`
      ]
    )

    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Vendor Created',
      description: `${newVendor.name} was added as a vendor`,
      timestamp: 'Just now',
      type: 'vendor',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    console.log(`✅ Created vendor: ${newVendor.name} (ID: ${newVendor.id})`)
    
    revalidatePath('/admin/vendors')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: newVendor
    }

  } catch (error) {
    console.error('❌ Error creating vendor:', error)
    return {
      success: false,
      error: 'Failed to create vendor'
    }
  }
})

// ✏️ Update vendor
export const updateVendor = createProtectedAction(async (id: number, updateData: UpdateVendorData, user: any) => {
  console.log(`🏪 Updating vendor ID: ${id}`)
  
  try {
    // Get current vendor data
    const currentResult = await query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    )

    if (currentResult.rows.length === 0) {
      return {
        success: false,
        error: 'Vendor not found'
      }
    }

    const currentVendor = currentResult.rows[0]

    // Check name uniqueness if being updated
    if (updateData.name && updateData.name.toLowerCase() !== currentVendor.name.toLowerCase()) {
      const existingResult = await query(
        'SELECT id FROM vendors WHERE LOWER(name) = LOWER($1) AND id != $2',
        [updateData.name, id]
      )

      if (existingResult.rows.length > 0) {
        return {
          success: false,
          error: 'Vendor with this name already exists'
        }
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    if (updates.length === 0) {
      return {
        success: false,
        error: 'No updates provided'
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const updateQuery = `
      UPDATE vendors 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query(updateQuery, values)
    const updatedVendor = result.rows[0] as Vendor

    // Log activity
    await query(
      `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        user.id,
        user.name,
        'UPDATE',
        'vendor',
        updatedVendor.id,
        `Updated vendor: ${updatedVendor.name}`
      ]
    )

    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Vendor Updated',
      description: `${updatedVendor.name} vendor details were updated`,
      timestamp: 'Just now',
      type: 'vendor',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    console.log(`✅ Updated vendor: ${updatedVendor.name}`)
    
    revalidatePath('/admin/vendors')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedVendor
    }

  } catch (error) {
    console.error('❌ Error updating vendor:', error)
    return {
      success: false,
      error: 'Failed to update vendor'
    }
  }
})

// 🗑️ Delete vendor
export const deleteVendor = createProtectedAction(async (id: number, user: any) => {
  console.log(`🏪 Deleting vendor ID: ${id}`)
  
  try {
    return await transaction(async (client) => {
      // Get vendor info before deletion
      const vendorResult = await client.query(
        'SELECT * FROM vendors WHERE id = $1',
        [id]
      )

      if (vendorResult.rows.length === 0) {
        throw new Error('Vendor not found')
      }

      const vendor = vendorResult.rows[0]

      // Check for dependencies (if you have purchase orders, quotations, etc.)
      // const dependenciesResult = await client.query(
      //   'SELECT COUNT(*) as count FROM purchase_orders WHERE vendor_id = $1',
      //   [id]
      // )

      // const dependencyCount = parseInt(dependenciesResult.rows[0].count)
      // if (dependencyCount > 0) {
      //   throw new Error(`Cannot delete vendor. It has ${dependencyCount} associated records.`)
      // }

      // Delete vendor
      await client.query('DELETE FROM vendors WHERE id = $1', [id])

      // Log activity
      await client.query(
        `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          user.id,
          user.name,
          'DELETE',
          'vendor',
          id,
          `Deleted vendor: ${vendor.name}`
        ]
      )

      // Broadcast activity
      broadcastActivity({
        id: Date.now(),
        title: 'Vendor Deleted',
        description: `${vendor.name} vendor was removed`,
        timestamp: 'Just now',
        type: 'vendor',
        user: {
          name: user.name,
          initials: user.name.split(' ').map((n: string) => n[0]).join('')
        }
      })

      console.log(`✅ Deleted vendor: ${vendor.name}`)
      return { success: true, data: vendor }
    })

  } catch (error: any) {
    console.error('❌ Error deleting vendor:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete vendor'
    }
  } finally {
    revalidatePath('/admin/vendors')
    revalidatePath('/dashboard')
  }
})

// 📊 Get vendor statistics
export const getVendorStats = createProtectedAction(async () => {
  console.log('📊 Fetching vendor statistics...')
  
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_vendors,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vendors,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_vendors,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as created_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as created_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as created_this_month
      FROM vendors
    `)

    console.log('✅ Retrieved vendor statistics')
    return {
      success: true,
      data: result.rows[0]
    }

  } catch (error) {
    console.error('❌ Error fetching vendor stats:', error)
    return {
      success: false,
      error: 'Failed to fetch vendor statistics'
    }
  }
})

// 📋 Get vendor categories
export const getVendorCategories = createProtectedAction(async () => {
  console.log('📋 Fetching vendor categories...')
  
  try {
    const result = await query(`
      SELECT 
        category,
        COUNT(*) as vendor_count
      FROM vendors 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY vendor_count DESC, category ASC
    `)

    console.log(`✅ Retrieved ${result.rows.length} vendor categories`)
    return {
      success: true,
      data: result.rows
    }

  } catch (error) {
    console.error('❌ Error fetching vendor categories:', error)
    return {
      success: false,
      error: 'Failed to fetch vendor categories'
    }
  }
}) 