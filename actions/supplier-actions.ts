'use server'

import { query, transaction } from '@/lib/postgresql-client'
import { createProtectedAction } from '@/lib/auth-utils'
import { broadcastActivity } from '@/lib/server-sent-events'
import { revalidatePath } from 'next/cache'

// Types
export interface Supplier {
  id: number
  name: string
  supplier_code: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreateSupplierData {
  name: string
  supplier_code: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  status?: 'active' | 'inactive'
}

export interface UpdateSupplierData {
  name?: string
  supplier_code?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  status?: 'active' | 'inactive'
}

// 📋 Get all suppliers
export const getSuppliers = createProtectedAction(async () => {
  console.log('🏪 Fetching all suppliers...')
  
  try {
    const result = await query(
      'SELECT * FROM suppliers ORDER BY name ASC'
    )

    console.log(`✅ Retrieved ${result.rows.length} suppliers`)
    return {
      success: true,
      data: result.rows as Supplier[]
    }

  } catch (error) {
    console.error('❌ Error fetching suppliers:', error)
    return {
      success: false,
      error: 'Failed to fetch suppliers'
    }
  }
})

// 📋 Get active suppliers only
export const getActiveSuppliers = createProtectedAction(async () => {
  console.log('🏪 Fetching active suppliers...')
  
  try {
    const result = await query(
      'SELECT * FROM suppliers WHERE status = $1 ORDER BY name ASC',
      ['active']
    )

    console.log(`✅ Retrieved ${result.rows.length} active suppliers`)
    return {
      success: true,
      data: result.rows as Supplier[]
    }

  } catch (error) {
    console.error('❌ Error fetching active suppliers:', error)
    return {
      success: false,
      error: 'Failed to fetch active suppliers'
    }
  }
})

// 📋 Get supplier by ID
export const getSupplier = createProtectedAction(async (id: number) => {
  console.log(`🏪 Fetching supplier with ID: ${id}`)
  
  try {
    const result = await query(
      'SELECT * FROM suppliers WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Supplier not found'
      }
    }

    console.log(`✅ Retrieved supplier: ${result.rows[0].name}`)
    return {
      success: true,
      data: result.rows[0] as Supplier
    }

  } catch (error) {
    console.error('❌ Error fetching supplier:', error)
    return {
      success: false,
      error: 'Failed to fetch supplier'
    }
  }
})

// ➕ Create new supplier
export const createSupplier = createProtectedAction(async (supplierData: CreateSupplierData, user: any) => {
  console.log(`🏪 Creating new supplier: ${supplierData.name}`)
  
  try {
    // Check if supplier code already exists
    const existingResult = await query(
      'SELECT id FROM suppliers WHERE supplier_code = $1',
      [supplierData.supplier_code]
    )

    if (existingResult.rows.length > 0) {
      return {
        success: false,
        error: 'Supplier code already exists'
      }
    }

    // Create supplier
    const result = await query(
      `INSERT INTO suppliers (name, supplier_code, contact_person, email, phone, address, category, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        supplierData.name,
        supplierData.supplier_code,
        supplierData.contact_person || null,
        supplierData.email || null,
        supplierData.phone || null,
        supplierData.address || null,
        supplierData.category || null,
        supplierData.status || 'active'
      ]
    )

    const newSupplier = result.rows[0] as Supplier

    // Log activity
    await query(
      `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        user.id,
        user.name,
        'CREATE',
        'supplier',
        newSupplier.id,
        `Created supplier: ${newSupplier.name}`
      ]
    )

    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Supplier Created',
      description: `${newSupplier.name} was added as a supplier`,
      timestamp: 'Just now',
      type: 'supplier',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    console.log(`✅ Created supplier: ${newSupplier.name} (ID: ${newSupplier.id})`)
    
    revalidatePath('/admin/suppliers')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: newSupplier
    }

  } catch (error) {
    console.error('❌ Error creating supplier:', error)
    return {
      success: false,
      error: 'Failed to create supplier'
    }
  }
})

// ✏️ Update supplier
export const updateSupplier = createProtectedAction(async (id: number, updateData: UpdateSupplierData, user: any) => {
  console.log(`🏪 Updating supplier ID: ${id}`)
  
  try {
    // Get current supplier data
    const currentResult = await query(
      'SELECT * FROM suppliers WHERE id = $1',
      [id]
    )

    if (currentResult.rows.length === 0) {
      return {
        success: false,
        error: 'Supplier not found'
      }
    }

    const currentSupplier = currentResult.rows[0]

    // Check supplier code uniqueness if being updated
    if (updateData.supplier_code && updateData.supplier_code !== currentSupplier.supplier_code) {
      const existingResult = await query(
        'SELECT id FROM suppliers WHERE supplier_code = $1 AND id != $2',
        [updateData.supplier_code, id]
      )

      if (existingResult.rows.length > 0) {
        return {
          success: false,
          error: 'Supplier code already exists'
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
      UPDATE suppliers 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query(updateQuery, values)
    const updatedSupplier = result.rows[0] as Supplier

    // Log activity
    await query(
      `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        user.id,
        user.name,
        'UPDATE',
        'supplier',
        updatedSupplier.id,
        `Updated supplier: ${updatedSupplier.name}`
      ]
    )

    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Supplier Updated',
      description: `${updatedSupplier.name} supplier details were updated`,
      timestamp: 'Just now',
      type: 'supplier',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    console.log(`✅ Updated supplier: ${updatedSupplier.name}`)
    
    revalidatePath('/admin/suppliers')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedSupplier
    }

  } catch (error) {
    console.error('❌ Error updating supplier:', error)
    return {
      success: false,
      error: 'Failed to update supplier'
    }
  }
})

// 🗑️ Delete supplier
export const deleteSupplier = createProtectedAction(async (id: number, user: any) => {
  console.log(`🏪 Deleting supplier ID: ${id}`)
  
  try {
    return await transaction(async (client) => {
      // Get supplier info before deletion
      const supplierResult = await client.query(
        'SELECT * FROM suppliers WHERE id = $1',
        [id]
      )

      if (supplierResult.rows.length === 0) {
        throw new Error('Supplier not found')
      }

      const supplier = supplierResult.rows[0]

      // Check for dependencies (if you have purchase orders, quotations, etc.)
      // const dependenciesResult = await client.query(
      //   'SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = $1',
      //   [id]
      // )

      // const dependencyCount = parseInt(dependenciesResult.rows[0].count)
      // if (dependencyCount > 0) {
      //   throw new Error(`Cannot delete supplier. It has ${dependencyCount} associated records.`)
      // }

      // Delete supplier
      await client.query('DELETE FROM suppliers WHERE id = $1', [id])

      // Log activity
      await client.query(
        `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          user.id,
          user.name,
          'DELETE',
          'supplier',
          id,
          `Deleted supplier: ${supplier.name}`
        ]
      )

      // Broadcast activity
      broadcastActivity({
        id: Date.now(),
        title: 'Supplier Deleted',
        description: `${supplier.name} supplier was removed`,
        timestamp: 'Just now',
        type: 'supplier',
        user: {
          name: user.name,
          initials: user.name.split(' ').map((n: string) => n[0]).join('')
        }
      })

      console.log(`✅ Deleted supplier: ${supplier.name}`)
      return { success: true, data: supplier }
    })

  } catch (error: any) {
    console.error('❌ Error deleting supplier:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete supplier'
    }
  } finally {
    revalidatePath('/admin/suppliers')
    revalidatePath('/dashboard')
  }
})

// 📊 Get supplier statistics
export const getSupplierStats = createProtectedAction(async () => {
  console.log('📊 Fetching supplier statistics...')
  
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_suppliers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_suppliers,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_suppliers,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as created_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as created_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as created_this_month
      FROM suppliers
    `)

    console.log('✅ Retrieved supplier statistics')
    return {
      success: true,
      data: result.rows[0]
    }

  } catch (error) {
    console.error('❌ Error fetching supplier stats:', error)
    return {
      success: false,
      error: 'Failed to fetch supplier statistics'
    }
  }
}) 