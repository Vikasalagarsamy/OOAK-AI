import { query } from "@/lib/postgresql-client"
import { getCurrentUser } from "@/lib/auth-utils"

/**
 * GET CURRENT EMPLOYEE - NOW 100% POSTGRESQL
 * ==========================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized employee lookup
 * - All Supabase dependencies eliminated
 */

export async function getCurrentEmployeeId() {
  try {
    console.log('👤 Getting current employee ID via PostgreSQL...')
    
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.id) {
      console.log('⚠️ No current user found')
      return null
    }

    // If the user already has an employeeId, return it
    if (currentUser.employeeId) {
      console.log(`✅ Using cached employee ID: ${currentUser.employeeId}`)
      return currentUser.employeeId
    }

    // Otherwise, try to find the employee record linked to this user via PostgreSQL
    const result = await query(`
      SELECT id 
      FROM employees 
      WHERE user_id = $1 
        AND is_active = true
      LIMIT 1
    `, [currentUser.id])

    if (result.rows.length === 0) {
      console.error(`❌ No employee record found for user: ${currentUser.id}`)
      return null
    }

    const employeeId = result.rows[0].id
    console.log(`✅ Found employee ID: ${employeeId} for user: ${currentUser.id}`)
    return employeeId

  } catch (error: any) {
    console.error('❌ Error getting current employee ID via PostgreSQL:', error)
    return null
  }
}

export async function getCurrentEmployee() {
  try {
    console.log('👤 Getting current employee data via PostgreSQL...')
    
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.id) {
      console.log('⚠️ No current user found')
      return null
    }

    let employee = null

    // Try to find the employee by employeeId if available
    if (currentUser.employeeId) {
      console.log(`🔍 Looking up employee by employeeId: ${currentUser.employeeId}`)
      
      const result = await query(`
        SELECT * 
        FROM employees 
        WHERE id = $1 
          AND is_active = true
      `, [currentUser.employeeId])

      if (result.rows.length > 0) {
        employee = result.rows[0]
        console.log(`✅ Found employee by employeeId: ${employee.first_name || employee.name}`)
      }
    }

    // If not found by employeeId, try to find by user_id
    if (!employee) {
      console.log(`🔍 Looking up employee by user_id: ${currentUser.id}`)
      
      const result = await query(`
        SELECT * 
        FROM employees 
        WHERE user_id = $1 
          AND is_active = true
      `, [currentUser.id])

      if (result.rows.length > 0) {
        employee = result.rows[0]
        console.log(`✅ Found employee by user_id: ${employee.first_name || employee.name}`)
      }
    }

    if (!employee) {
      console.error(`❌ No employee record found for user: ${currentUser.id}`)
      return null
    }

    return employee

  } catch (error: any) {
    console.error('❌ Error getting current employee via PostgreSQL:', error)
    return null
  }
}

/**
 * Get current employee with company and department information via PostgreSQL
 */
export async function getCurrentEmployeeWithDetails() {
  try {
    console.log('👤 Getting current employee with details via PostgreSQL...')
    
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.id) {
      console.log('⚠️ No current user found')
      return null
    }

    // Get employee with related company and department data via optimized JOIN
    const result = await query(`
      SELECT 
        e.*,
        d.name as department_name,
        ec.company_id,
        c.name as company_name,
        ec.branch_id,
        b.name as branch_name
      FROM employees e
      LEFT JOIN departments d ON e.department = d.id
      LEFT JOIN employee_companies ec ON e.id = ec.employee_id AND ec.is_primary = true
      LEFT JOIN companies c ON ec.company_id = c.id
      LEFT JOIN branches b ON ec.branch_id = b.id
      WHERE (e.user_id = $1 OR e.id = $2)
        AND e.is_active = true
      LIMIT 1
    `, [currentUser.id, currentUser.employeeId || null])

    if (result.rows.length === 0) {
      console.error(`❌ No employee record found for user: ${currentUser.id}`)
      return null
    }

    const employee = result.rows[0]
    console.log(`✅ Found employee with details: ${employee.first_name || employee.name}`)
    return employee

  } catch (error: any) {
    console.error('❌ Error getting current employee with details via PostgreSQL:', error)
    return null
  }
}

