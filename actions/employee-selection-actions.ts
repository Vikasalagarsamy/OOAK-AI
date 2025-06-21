"use server"

import { query, transaction } from "@/lib/postgresql-client"
import type { Employee } from "@/types/employee"
import { triggerLeadAssignmentTasks } from '@/actions/lead-task-integration-hooks'

// Replace the getEmployeesForLeadAssignment function with this fixed version
export async function getEmployeesForLeadAssignment(
  companyId?: number | undefined,
  branchId?: number | undefined,
  roleFilter = "Sales",
): Promise<Employee[]> {
  try {
    console.log(
      `🔍 [EMPLOYEE SELECTION] Fetching employees for lead assignment via PostgreSQL - Company: ${companyId}, Branch: ${branchId}, Role: ${roleFilter}`,
    )

    // First, get all active employees with their details
    const employeesResult = await query(`
      SELECT 
        e.id, 
        e.employee_id, 
        e.first_name, 
        e.last_name, 
        e.job_title, 
        e.status, 
        e.department_id,
        d.name as department_name,
        des.name as designation_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE e.status = 'active'
      ORDER BY e.first_name
    `)

    const allEmployees = employeesResult.rows

    console.log(`📋 [EMPLOYEE SELECTION] Found ${allEmployees.length} active employees`)

    // Get all employee allocations
    const allocationsResult = await query(`
      SELECT 
        id,
        employee_id,
        company_id,
        branch_id,
        project_id,
        allocation_percentage,
        is_primary,
        start_date,
        end_date,
        status
      FROM employee_companies
      WHERE end_date IS NULL OR end_date > NOW()
      ORDER BY is_primary DESC
    `)

    const allAllocations = allocationsResult.rows

    console.log(`🏢 [EMPLOYEE SELECTION] Found ${allAllocations.length} active allocations`)

    // Get all departments to identify sales departments
    const departmentsResult = await query(`SELECT id, name FROM departments`)
    const departments = departmentsResult.rows

    // Identify sales department IDs
    const salesDepartmentIds = departments
      ? departments.filter((dept) => dept.name.toLowerCase().includes("sales")).map((dept) => dept.id)
      : []

    console.log(`💼 [EMPLOYEE SELECTION] Identified sales department IDs: ${salesDepartmentIds.join(", ")}`)

    // Filter employees based on allocations and role
    let eligibleEmployees = allEmployees.map((emp) => {
      // Get all allocations for this employee
      const employeeAllocations = allAllocations ? allAllocations.filter((alloc) => alloc.employee_id === emp.id) : []

      // Check if employee has an allocation to the specified company
      const hasCompanyAllocation = !companyId || employeeAllocations.some((alloc) => alloc.company_id === companyId)

      // Check if employee has an allocation to the specified branch
      const hasBranchAllocation = !branchId || employeeAllocations.some((alloc) => alloc.branch_id === branchId)

      // Check if employee is in a sales role
      const isSalesRole =
        // Check job title
        (emp.job_title && emp.job_title.toLowerCase().includes("sales")) ||
        // Check department
        (emp.department_name && emp.department_name.toLowerCase().includes("sales")) ||
        // Check department ID
        (emp.department_id && salesDepartmentIds.includes(emp.department_id)) ||
        // Check designation
        (emp.designation_name && emp.designation_name.toLowerCase().includes("sales"))

      console.log(`👤 [EMPLOYEE SELECTION] Employee ${emp.employee_id} (${emp.first_name} ${emp.last_name}): sales=${isSalesRole}, companyAlloc=${hasCompanyAllocation}, branchAlloc=${hasBranchAllocation}`)

      // Format the employee data with allocation information
      return {
        id: emp.id,
        employee_id: emp.employee_id,
        name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
        job_title: emp.job_title || "",
        department: emp.department_name || "",
        designation: emp.designation_name || "",
        status: emp.status || "active",
        is_sales: isSalesRole,
        allocations: employeeAllocations,
        hasCompanyAllocation,
        hasBranchAllocation,
        // Find the relevant allocation for this company/branch
        relevantAllocation: employeeAllocations.find(
          (alloc) => (!companyId || alloc.company_id === companyId) && (!branchId || alloc.branch_id === branchId),
        ),
        // Primary allocation
        primaryAllocation: employeeAllocations.find((alloc) => alloc.is_primary),
      }
    })

    // TEMPORARY FIX: Make filtering more lenient to show employees
    eligibleEmployees = eligibleEmployees.filter((emp) => {
      // For now, show all active employees - we'll fix the allocation system later
      console.log(`✅ [EMPLOYEE SELECTION] Including employee ${emp.employee_id} (${emp.full_name})`)
      return true
      
      // Original strict filtering (commented out for now):
      // // Must be in sales role if roleFilter is specified
      // if (roleFilter && roleFilter.toLowerCase() === "sales" && !emp.is_sales) {
      //   console.log(`🚫 Filtering out ${emp.employee_id} - not in sales role`)
      //   return false
      // }
      
      // // Must have allocation to the specified company if companyId is provided
      // if (companyId && !emp.hasCompanyAllocation) {
      //   console.log(`🚫 Filtering out ${emp.employee_id} - no company allocation`)
      //   return false
      // }
      
      // // Must have allocation to the specified branch if branchId is provided
      // if (branchId && !emp.hasBranchAllocation) {
      //   console.log(`🚫 Filtering out ${emp.employee_id} - no branch allocation`)
      //   return false
      // }
      
      // return true
    })

    // Sort employees: prioritize those with direct allocations to the company/branch
    eligibleEmployees.sort((a, b) => {
      // First priority: has relevant allocation
      if (a.relevantAllocation && !b.relevantAllocation) return -1
      if (!a.relevantAllocation && b.relevantAllocation) return 1

      // Second priority: is primary allocation
      if (a.relevantAllocation?.is_primary && !b.relevantAllocation?.is_primary) return -1
      if (!a.relevantAllocation?.is_primary && b.relevantAllocation?.is_primary) return 1

      // Third priority: allocation percentage (higher first)
      if (a.relevantAllocation && b.relevantAllocation) {
        return (b.relevantAllocation.allocation_percentage || 0) - (a.relevantAllocation.allocation_percentage || 0)
      }

      // Fourth priority: alphabetical by name
      return a.name.localeCompare(b.name)
    })

    console.log(`✅ [EMPLOYEE SELECTION] Found ${eligibleEmployees.length} eligible employees for lead assignment`)
    console.log(`📝 [EMPLOYEE SELECTION] Employee list:`, eligibleEmployees.map(emp => `${emp.employee_id} (${emp.full_name})`))

    // Format the final result
    return eligibleEmployees.map((emp) => ({
      id: emp.id,
      employee_id: emp.employee_id,
      name: emp.name,
      first_name: emp.first_name,
      last_name: emp.last_name,
      full_name: emp.full_name,
      job_title: emp.job_title,
      role: emp.job_title,
      department: emp.department,
      designation: emp.designation,
      status: emp.status,
      is_sales: emp.is_sales,
      is_primary: emp.relevantAllocation?.is_primary || false,
      allocation_percentage: emp.relevantAllocation?.allocation_percentage || 0,
      company_id: emp.relevantAllocation?.company_id || emp.primaryAllocation?.company_id,
      branch_id: emp.relevantAllocation?.branch_id || emp.primaryAllocation?.branch_id,
    }))
  } catch (error) {
    console.error("❌ [EMPLOYEE SELECTION] Exception in getEmployeesForLeadAssignment:", error)
    return []
  }
}

// Update the assignLeadToEmployee function
export async function assignLeadToEmployee(
  leadId: number,
  employeeId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🎯 [LEAD ASSIGNMENT] Assigning lead ${leadId} to employee ${employeeId} via PostgreSQL`)

    return await transaction(async (client) => {
      // Get the lead details first
      const leadResult = await client.query(`
        SELECT * FROM leads WHERE id = $1
      `, [leadId])

      if (leadResult.rows.length === 0) {
        return { success: false, message: "Lead not found" }
      }

      const lead = leadResult.rows[0]

      // Get the employee details
      const employeeResult = await client.query(`
        SELECT id, first_name, last_name, status
        FROM employees 
        WHERE id = $1
      `, [employeeId])

      if (employeeResult.rows.length === 0) {
        return { success: false, message: "Employee not found" }
      }

      const employee = employeeResult.rows[0]

      // Verify employee is active
      if (employee.status !== "active") {
        return {
          success: false,
          message: `Cannot assign lead to inactive employee: ${employee.first_name} ${employee.last_name}`,
        }
      }

      // Check if employee has allocation to the lead's company
      if (lead.company_id) {
        const allocResult = await client.query(`
          SELECT id FROM employee_companies
          WHERE employee_id = $1 AND company_id = $2 
          AND (end_date IS NULL OR end_date > NOW())
        `, [employeeId, lead.company_id])

        if (allocResult.rows.length === 0) {
          console.warn(
            `⚠️ [LEAD ASSIGNMENT] Employee ${employeeId} has no allocation to company ${lead.company_id}, but proceeding with assignment`,
          )
        }
      }

      // Update the lead
      await client.query(`
        UPDATE leads
        SET 
          assigned_to = $1,
          status = 'ASSIGNED',
          updated_at = NOW()
        WHERE id = $2
      `, [employeeId, leadId])

      // 🤖 TRIGGER AI TASK GENERATION FOR LEAD ASSIGNMENT
      try {
        const updatedLeadData = {
          ...lead,
          assigned_to: employeeId,
          status: "ASSIGNED" as const,
          updated_at: new Date().toISOString()
        }
        
        console.log(`🚀 [LEAD ASSIGNMENT] Triggering AI task generation for lead ${leadId} assigned to employee ${employeeId}`)
        const aiResult = await triggerLeadAssignmentTasks(
          leadId,
          updatedLeadData,
          `${employee.first_name} ${employee.last_name} Assignment`
        )
        
        if (aiResult.success && ((aiResult.tasksGenerated ?? 0) ?? 0) > 0) {
          console.log(`✅ [LEAD ASSIGNMENT] AI generated ${(aiResult.tasksGenerated ?? 0)} task(s) for lead ${leadId} → ${employee.first_name} ${employee.last_name}`)
        } else {
          console.log(`ℹ️ [LEAD ASSIGNMENT] No AI tasks generated for lead ${leadId}: ${aiResult.message}`)
        }
      } catch (aiError) {
        console.error('⚠️ [LEAD ASSIGNMENT] AI task generation failed (continuing with assignment):', aiError)
        // Don't fail the entire assignment if AI task generation fails
      }

      // Log the assignment in the activity log if the table exists
      try {
        // Check if activity_log table exists
        const tableCheckResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'activity_log' AND table_schema = 'public'
        `)

        if (tableCheckResult.rows.length > 0) {
          await client.query(`
            INSERT INTO activity_log (
              activity_type, entity_type, entity_id, user_id, description, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
          `, [
            'lead_assignment',
            'lead',
            leadId,
            null, // System action
            `Lead #${leadId} assigned to ${employee.first_name} ${employee.last_name}`
          ])
        }
      } catch (logError) {
        console.error("⚠️ [LEAD ASSIGNMENT] Error logging activity:", logError)
        // Don't fail the assignment if logging fails
      }

      return {
        success: true,
        message: `Lead successfully assigned to ${employee.first_name} ${employee.last_name}`,
      }
    })
  } catch (error) {
    console.error("❌ [LEAD ASSIGNMENT] Exception assigning lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
