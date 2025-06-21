"use server"

import { query, transaction } from "@/lib/postgresql-client"
import type { Employee } from "@/types/employee"

/**
 * SIMPLE EMPLOYEE SELECTION - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries with JOINs for optimal performance
 * - Enhanced error handling and logging
 * - Employee allocation and lead assignment workflows
 * - AI task integration for lead assignments
 * - All Supabase dependencies eliminated
 */

// ULTRA SIMPLE VERSION - Just get all active employees
export async function getEmployeesForLeadAssignment(
  companyId?: number | undefined,
  branchId?: number | undefined,
  roleFilter = "Sales",
): Promise<Employee[]> {
  console.log('🔍 [ULTRA-SIMPLE] Getting employees for lead assignment via PostgreSQL...')
  console.log(`📋 [ULTRA-SIMPLE] Company ID: ${companyId}, Branch ID: ${branchId}`)

  try {
    // First get the sales department ID
    console.log('📋 [ULTRA-SIMPLE] Fetching sales department...')
    const salesDeptResult = await query(`
      SELECT id 
      FROM departments 
      WHERE name = 'SALES'
      LIMIT 1
    `)

    if (salesDeptResult.rows.length === 0) {
      console.error('❌ [ULTRA-SIMPLE] Sales department not found')
      return []
    }

    const salesDeptId = salesDeptResult.rows[0].id
    console.log(`📋 [ULTRA-SIMPLE] Found sales department ID: ${salesDeptId}`)

    // Get all active employees with their department and company allocation info
    console.log('📋 [ULTRA-SIMPLE] Fetching sales employees with company allocations...')
    
    const employeesResult = await query(`
      SELECT 
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.job_title,
        e.status,
        e.department_id,
        d.id as dept_id,
        d.name as dept_name,
        ec.company_id,
        ec.branch_id,
        ec.allocation_percentage,
        ec.is_primary,
        ec.status as allocation_status
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_companies ec ON e.id = ec.employee_id AND ec.status = 'active'
      WHERE e.status = 'active'
      AND e.department_id = $1
      ORDER BY e.first_name ASC
    `, [salesDeptId])

    const employees = employeesResult.rows

    console.log(`✅ [ULTRA-SIMPLE] Found ${employees.length} active sales employees`)
    
    if (employees.length === 0) {
      console.warn('⚠️ [ULTRA-SIMPLE] No active sales employees found in the database')
      return []
    }

    // Group employee data by employee ID (since JOINs create multiple rows per employee)
    const employeeMap = new Map()

    employees.forEach(row => {
      if (!employeeMap.has(row.id)) {
        employeeMap.set(row.id, {
          id: row.id,
          employee_id: row.employee_id,
          first_name: row.first_name,
          last_name: row.last_name,
          job_title: row.job_title,
          status: row.status,
          department_id: row.department_id,
          departments: { id: row.dept_id, name: row.dept_name },
          employee_companies: []
        })
      }

      if (row.company_id) {
        employeeMap.get(row.id).employee_companies.push({
          company_id: row.company_id,
          branch_id: row.branch_id,
          allocation_percentage: row.allocation_percentage,
          is_primary: row.is_primary,
          status: row.allocation_status
        })
      }
    })

    const groupedEmployees = Array.from(employeeMap.values())

    // Filter employees based on company allocation if companyId is provided
    let filteredEmployees = groupedEmployees
    if (companyId) {
      filteredEmployees = groupedEmployees.filter(emp => {
        // Check if employee has allocation to this company
        const hasAllocation = emp.employee_companies?.some((allocation: any) => 
          allocation.company_id === companyId && 
          allocation.status === 'active' &&
          (!branchId || allocation.branch_id === branchId)
        )
        console.log(`👤 Employee ${emp.first_name} ${emp.last_name} - Has allocation: ${hasAllocation}`)
        return hasAllocation
      })
      console.log(`✅ [ULTRA-SIMPLE] Found ${filteredEmployees.length} employees allocated to company ${companyId}`)
    }

    // Format for the dropdown
    const formattedEmployees = filteredEmployees.map(emp => {
      // Find the relevant company allocation
      const companyAllocation = companyId 
        ? emp.employee_companies?.find((a: any) => a.company_id === companyId)
        : emp.employee_companies?.find((a: any) => a.is_primary) || emp.employee_companies?.[0]

      return {
        id: emp.id,
        employee_id: emp.employee_id,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        job_title: emp.job_title || 'Sales Representative',
        role: emp.job_title || 'Sales Representative',
        department: 'Sales',
        designation: emp.job_title || 'Sales Representative',
        status: emp.status,
        is_sales: true,
        is_primary: companyAllocation?.is_primary || false,
        allocation_percentage: companyAllocation?.allocation_percentage || 0,
        company_id: companyAllocation?.company_id,
        branch_id: companyAllocation?.branch_id
      }
    })

    console.log(`🎯 [ULTRA-SIMPLE] Returning ${formattedEmployees.length} formatted employees`)
    formattedEmployees.forEach((emp, index) => {
      console.log(`  👤 [${index + 1}] ${emp.name} (ID: ${emp.id}) - ${emp.job_title}`)
    })

    return formattedEmployees

  } catch (error) {
    console.error('💥 [ULTRA-SIMPLE] Exception in getEmployeesForLeadAssignment:', error)
    console.log('🔄 [ULTRA-SIMPLE] Returning empty array due to exception')
    return []
  }
}

export async function assignLeadToEmployee(
  leadId: number,
  employeeId: number,
): Promise<{ success: boolean; message: string }> {
  console.log(`📋 [SIMPLE] Assigning lead ${leadId} to employee ${employeeId} via PostgreSQL`)
  
  try {
    // First get the lead data for task creation
    console.log(`🔍 [SIMPLE] Fetching lead data for task creation...`)
    const leadResult = await query(`
      SELECT 
        l.*,
        c.name as company_name,
        b.name as branch_name,
        b.location as branch_location
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      WHERE l.id = $1
    `, [leadId])

    if (leadResult.rows.length === 0) {
      console.error('❌ [SIMPLE] Lead not found')
      return {
        success: false,
        message: `Lead not found with ID: ${leadId}`
      }
    }

    const lead = leadResult.rows[0]
    console.log(`✅ [SIMPLE] Found lead:`, {
      id: lead.id,
      lead_number: lead.lead_number,
      client_name: lead.client_name,
      company_id: lead.company_id,
      branch_id: lead.branch_id
    })

    // Get employee data for task assignment
    console.log(`🔍 [SIMPLE] Fetching employee data...`)
    const employeeResult = await query(`
      SELECT * FROM employees WHERE id = $1
    `, [employeeId])

    if (employeeResult.rows.length === 0) {
      console.error('❌ [SIMPLE] Employee not found')
      return {
        success: false,
        message: `Employee not found with ID: ${employeeId}`
      }
    }

    const employee = employeeResult.rows[0]
    console.log(`✅ [SIMPLE] Found employee:`, {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      department_id: employee.department_id,
      job_title: employee.job_title
    })

    // Update the lead
    console.log(`📝 [SIMPLE] Updating lead assignment...`)
    const updateResult = await query(`
      UPDATE leads 
      SET 
        assigned_to = $1,
        status = 'ASSIGNED',
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [employeeId, leadId])

    if (updateResult.rows.length === 0) {
      console.error('❌ [SIMPLE] Failed to update lead assignment')
      return {
        success: false,
        message: 'Failed to update lead assignment'
      }
    }

    console.log(`✅ [SIMPLE] Lead assignment updated successfully`)

    // 🤖 TRIGGER AI TASK GENERATION
    try {
      const { triggerLeadAssignmentTasks } = await import('@/actions/lead-task-integration-hooks')
      
      console.log('🚀 [SIMPLE] Triggering AI task generation for lead assignment...')
      const aiResult = await triggerLeadAssignmentTasks(
        leadId,
        {
          id: lead.id,
          lead_number: lead.lead_number,
          client_name: lead.client_name,
          status: 'ASSIGNED',
          estimated_value: lead.estimated_value,
          assigned_to: employeeId,
          company_id: lead.company_id,
          branch_id: lead.branch_id,
          created_at: lead.created_at,
          updated_at: new Date().toISOString()
        },
        `${employee.first_name} ${employee.last_name}`
      )
      
      if (aiResult.success && ((aiResult.tasksGenerated ?? 0) ?? 0) > 0) {
        console.log(`✅ [SIMPLE] AI generated ${(aiResult.tasksGenerated ?? 0)} task(s) for lead ${lead.lead_number}`)
      } else {
        console.log(`ℹ️ [SIMPLE] No AI tasks generated for lead ${lead.lead_number}: ${aiResult.message}`)
      }
    } catch (aiError) {
      console.error('⚠️ [SIMPLE] AI task generation failed:', aiError)
      // Don't fail the entire assignment if AI task generation fails
    }

    console.log(`✅ [SIMPLE] Successfully assigned lead ${leadId} to employee ${employeeId}`)
    return {
      success: true,
      message: 'Lead assigned successfully'
    }

  } catch (error) {
    console.error('💥 [SIMPLE] Exception in assignLeadToEmployee:', error)
    return {
      success: false,
      message: `Failed to assign lead: ${error}`
    }
  }
} 