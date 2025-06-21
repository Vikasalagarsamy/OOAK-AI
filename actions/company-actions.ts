'use server'

import { query, transaction } from '@/lib/postgresql-client'
import { createProtectedAction } from '@/lib/auth-utils'
import { broadcastActivity } from '@/lib/server-sent-events'
import { revalidatePath } from 'next/cache'

// Types
export interface Company {
  id: number
  name: string
  company_code: string
  address?: string
  phone?: string
  email?: string
  website?: string
  created_at: string
  updated_at: string
}

export interface CreateCompanyData {
  name: string
  company_code: string
  address?: string
  phone?: string
  email?: string
  website?: string
}

export interface UpdateCompanyData {
  name?: string
  company_code?: string
  address?: string
  phone?: string
  email?: string
  website?: string
}

// 📋 Get all companies
export const getCompanies = createProtectedAction(async () => {
  console.log('🏢 Fetching all companies...')
  
  try {
    const result = await query(
      'SELECT * FROM companies ORDER BY name ASC'
    )

    console.log(`✅ Retrieved ${result.rows.length} companies`)
    return {
      success: true,
      data: result.rows as Company[]
    }

  } catch (error) {
    console.error('❌ Error fetching companies:', error)
    return {
      success: false,
      error: 'Failed to fetch companies'
    }
  }
})

// 📋 Get company by ID
export const getCompany = createProtectedAction(async (id: number) => {
  console.log(`🏢 Fetching company with ID: ${id}`)
  
  try {
    const result = await query(
      'SELECT * FROM companies WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Company not found'
      }
    }

    console.log(`✅ Retrieved company: ${result.rows[0].name}`)
    return {
      success: true,
      data: result.rows[0] as Company
    }

  } catch (error) {
    console.error('❌ Error fetching company:', error)
    return {
      success: false,
      error: 'Failed to fetch company'
    }
  }
})

// 📋 Get companies with basic info (for dropdowns)
export const getCompaniesBasic = createProtectedAction(async () => {
  console.log('🏢 Fetching basic company info...')
  
  try {
    const result = await query(
      'SELECT id, name, company_code FROM companies ORDER BY name ASC'
    )

    console.log(`✅ Retrieved ${result.rows.length} companies (basic info)`)
    return {
      success: true,
      data: result.rows
    }

  } catch (error) {
    console.error('❌ Error fetching basic companies:', error)
    return {
      success: false,
      error: 'Failed to fetch companies'
    }
  }
})

// ➕ Create new company
export const createCompany = createProtectedAction(async (companyData: CreateCompanyData, user: any) => {
  console.log(`🏢 Creating new company: ${companyData.name}`)
  
  try {
    // Check if company code already exists
    const existingResult = await query(
      'SELECT id FROM companies WHERE company_code = $1',
      [companyData.company_code]
    )

    if (existingResult.rows.length > 0) {
      return {
        success: false,
        error: 'Company code already exists'
      }
    }

    // Create company
    const result = await query(
      `INSERT INTO companies (name, company_code, address, phone, email, website, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        companyData.name,
        companyData.company_code,
        companyData.address || null,
        companyData.phone || null,
        companyData.email || null,
        companyData.website || null
      ]
    )

    const newCompany = result.rows[0] as Company

    // Log activity
    await query(
      `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        user.id,
        user.name,
        'CREATE',
        'company',
        newCompany.id,
        `Created company: ${newCompany.name}`
      ]
    )

    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Company Created',
      description: `${newCompany.name} was created`,
      timestamp: 'Just now',
      type: 'company',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    console.log(`✅ Created company: ${newCompany.name} (ID: ${newCompany.id})`)
    
    revalidatePath('/admin/companies')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: newCompany
    }

  } catch (error) {
    console.error('❌ Error creating company:', error)
    return {
      success: false,
      error: 'Failed to create company'
    }
  }
})

// ✏️ Update company
export const updateCompany = createProtectedAction(async (id: number, updateData: UpdateCompanyData, user: any) => {
  console.log(`🏢 Updating company ID: ${id}`)
  
  try {
    // Get current company data
    const currentResult = await query(
      'SELECT * FROM companies WHERE id = $1',
      [id]
    )

    if (currentResult.rows.length === 0) {
      return {
        success: false,
        error: 'Company not found'
      }
    }

    const currentCompany = currentResult.rows[0]

    // Check company code uniqueness if being updated
    if (updateData.company_code && updateData.company_code !== currentCompany.company_code) {
      const existingResult = await query(
        'SELECT id FROM companies WHERE company_code = $1 AND id != $2',
        [updateData.company_code, id]
      )

      if (existingResult.rows.length > 0) {
        return {
          success: false,
          error: 'Company code already exists'
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
      UPDATE companies 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query(updateQuery, values)
    const updatedCompany = result.rows[0] as Company

    // Log activity
    await query(
      `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        user.id,
        user.name,
        'UPDATE',
        'company',
        updatedCompany.id,
        `Updated company: ${updatedCompany.name}`
      ]
    )

    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Company Updated',
      description: `${updatedCompany.name} was updated`,
      timestamp: 'Just now',
      type: 'company',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    console.log(`✅ Updated company: ${updatedCompany.name}`)
    
    revalidatePath('/admin/companies')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedCompany
    }

  } catch (error) {
    console.error('❌ Error updating company:', error)
    return {
      success: false,
      error: 'Failed to update company'
    }
  }
})

// 🗑️ Delete company
export const deleteCompany = createProtectedAction(async (id: number, user: any) => {
  console.log(`🏢 Deleting company ID: ${id}`)
  
  try {
    return await transaction(async (client) => {
      // Get company info before deletion
      const companyResult = await client.query(
        'SELECT * FROM companies WHERE id = $1',
        [id]
      )

      if (companyResult.rows.length === 0) {
        throw new Error('Company not found')
      }

      const company = companyResult.rows[0]

      // Check for dependencies
      const branchesResult = await client.query(
        'SELECT COUNT(*) as count FROM branches WHERE company_id = $1',
        [id]
      )

      const branchCount = parseInt(branchesResult.rows[0].count)
      if (branchCount > 0) {
        throw new Error(`Cannot delete company. It has ${branchCount} associated branches.`)
      }

      const employeesResult = await client.query(
        'SELECT COUNT(*) as count FROM employees WHERE company_id = $1',
        [id]
      )

      const employeeCount = parseInt(employeesResult.rows[0].count)
      if (employeeCount > 0) {
        throw new Error(`Cannot delete company. It has ${employeeCount} associated employees.`)
      }

      // Delete company
      await client.query('DELETE FROM companies WHERE id = $1', [id])

      // Log activity
      await client.query(
        `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          user.id,
          user.name,
          'DELETE',
          'company',
          id,
          `Deleted company: ${company.name}`
        ]
      )

      console.log(`✅ Deleted company: ${company.name}`)
      return { success: true, data: company }
    })

  } catch (error: any) {
    console.error('❌ Error deleting company:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete company'
    }
  } finally {
    revalidatePath('/admin/companies')
    revalidatePath('/dashboard')
  }
})

// 📊 Get company statistics
export const getCompanyStats = createProtectedAction(async () => {
  console.log('📊 Fetching company statistics...')
  
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_companies,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as created_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as created_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as created_this_month
      FROM companies
    `)

    console.log('✅ Retrieved company statistics')
    return {
      success: true,
      data: result.rows[0]
    }

  } catch (error) {
    console.error('❌ Error fetching company stats:', error)
    return {
      success: false,
      error: 'Failed to fetch company statistics'
    }
  }
})

// 🏪 Get all branches
export const getBranches = createProtectedAction(async () => {
  console.log('🏪 Fetching all branches...')
  
  try {
    const result = await query(`
      SELECT 
        b.*,
        c.name as company_name
      FROM branches b
      LEFT JOIN companies c ON b.company_id = c.id
      ORDER BY c.name, b.name
    `)

    console.log(`✅ Retrieved ${result.rows.length} branches`)
    return {
      success: true,
      data: result.rows
    }

  } catch (error) {
    console.error('❌ Error fetching branches:', error)
    return {
      success: false,
      error: 'Failed to fetch branches'
    }
  }
})

// 🏪 Get branches by company
export const getBranchesByCompany = createProtectedAction(async (companyId: number) => {
  console.log(`🏪 Fetching branches for company ${companyId}...`)
  
  try {
    const result = await query(`
      SELECT * FROM branches
      WHERE company_id = $1
      ORDER BY name
    `, [companyId])

    console.log(`✅ Retrieved ${result.rows.length} branches for company ${companyId}`)
    return {
      success: true,
      data: result.rows
    }

  } catch (error) {
    console.error(`❌ Error fetching branches for company ${companyId}:`, error)
    return {
      success: false,
      error: 'Failed to fetch branches'
    }
  }
}) 