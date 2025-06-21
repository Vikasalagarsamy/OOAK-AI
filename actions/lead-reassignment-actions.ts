"use server"

import { query } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"
import { getCurrentUser } from "@/lib/auth-utils"

// Get employees for a specific company and branch
export async function getEmployeesByCompanyAndBranch(
  companyId: number,
  branchId: number | null,
  location: string | null,
) {
  try {
    console.log(`👥 [REASSIGNMENT] Fetching employees for company ${companyId}, branch ${branchId || 'any'} via PostgreSQL...`)

    // Build the query with proper joins - now including designation and company information
    let queryText = `
      SELECT 
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.job_title,
        e.status,
        e.designation_id,
        d.name as designation_name,
        ec.company_id,
        ec.branch_id,
        ec.is_primary,
        ec.allocation_percentage,
        ec.status as employment_status,
        c.name as company_name
      FROM employees e
      INNER JOIN employee_companies ec ON e.id = ec.employee_id
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN companies c ON ec.company_id = c.id
      WHERE ec.company_id = $1
      AND e.status = 'active'
      AND ec.status = 'active'
    `

    const params: any[] = [companyId]

    // Add branch filter if provided
    if (branchId) {
      queryText += ` AND ec.branch_id = $${params.length + 1}`
      params.push(branchId)
    }

    queryText += ` ORDER BY e.first_name ASC, e.last_name ASC`

    const result = await query(queryText, params)

    // Transform the data to flatten the structure
    const employees = result.rows.map((emp) => ({
      id: emp.id,
      employee_id: emp.employee_id || `EMP-${emp.id}`,
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      full_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${emp.id}`,
      designation: emp.designation_name || emp.job_title || "Staff",
      company_name: emp.company_name || "Unknown Company",
      company_id: emp.company_id,
      branch_id: emp.branch_id,
      is_sales_role: true, // Include all employees as potential assignees
    }))

    console.log(`✅ [REASSIGNMENT] Found ${employees.length} employees for company ${companyId}, branch ${branchId || "any"}`)
    return employees
  } catch (error: any) {
    console.error("❌ [REASSIGNMENT] Exception in getEmployeesByCompanyAndBranch:", error)
    return []
  }
}

export async function reassignLead(
  leadId: string,
  employeeId: string,
): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    console.log(`🔄 [REASSIGNMENT] Reassigning lead ${leadId} to employee ${employeeId} via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get the lead details
    const leadResult = await query(`
      SELECT 
        id, 
        lead_number, 
        client_name, 
        assigned_to, 
        status,
        e.first_name as assigned_to_first_name,
        e.last_name as assigned_to_last_name
      FROM leads l
      LEFT JOIN employees e ON l.assigned_to = e.id
      WHERE l.id = $1
    `, [leadId])

    if (leadResult.rows.length === 0) {
      console.error("❌ [REASSIGNMENT] Lead not found:", leadId)
      return { success: false, error: "Lead not found" }
    }

    const lead = leadResult.rows[0]

    // Check if the user is authorized to reassign this lead
    if (lead.assigned_to !== currentUser.employeeId && !currentUser.isAdmin) {
      return { success: false, error: "You are not authorized to reassign this lead" }
    }

    // Get the employee details
    const employeeResult = await query(`
      SELECT id, first_name, last_name, status
      FROM employees
      WHERE id = $1
    `, [employeeId])

    if (employeeResult.rows.length === 0) {
      return { success: false, error: "Employee not found" }
    }

    const employee = employeeResult.rows[0]

    // Check if employee is active
    if (employee.status !== "active") {
      return {
        success: false,
        error: `Cannot reassign lead to inactive employee: ${employee.first_name} ${employee.last_name}`,
      }
    }

    // Update the lead's assigned_to field
    const updateResult = await query(`
      UPDATE leads 
      SET 
        assigned_to = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, lead_number
    `, [employeeId, leadId])

    if (updateResult.rowCount === 0) {
      console.error("❌ [REASSIGNMENT] Failed to update lead assignment")
      return { success: false, error: "Failed to reassign lead" }
    }

    // Log the activity
    const previousAssignee = lead.assigned_to_first_name && lead.assigned_to_last_name 
      ? `${lead.assigned_to_first_name} ${lead.assigned_to_last_name}` 
      : "unassigned"

    await logActivity({
      action: "REASSIGN_LEAD",
      entityType: "lead",
      entityId: leadId,
      description: `Lead ${lead.lead_number} reassigned from ${previousAssignee} to ${employee.first_name} ${employee.last_name}`,
    })

    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/manage-lead")
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/unassigned-lead")

    console.log(`✅ [REASSIGNMENT] Lead ${lead.lead_number} successfully reassigned to ${employee.first_name} ${employee.last_name}`)

    return {
      success: true,
      message: `Lead ${lead.lead_number} reassigned to ${employee.first_name} ${employee.last_name}`,
    }
  } catch (error: any) {
    console.error("❌ [REASSIGNMENT] Error reassigning lead:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Get lead reassignment history
export async function getLeadReassignmentHistory(leadId: string) {
  try {
    console.log(`📋 [REASSIGNMENT] Fetching reassignment history for lead ${leadId} via PostgreSQL...`)

    const result = await query(`
      SELECT 
        al.id,
        al.action,
        al.description,
        al.created_at,
        al.user_id,
        e.first_name,
        e.last_name
      FROM activity_logs al
      LEFT JOIN employees e ON al.user_id::text = e.id::text
      WHERE al.entity_type = 'lead'
      AND al.entity_id = $1
      AND al.action IN ('REASSIGN_LEAD', 'ASSIGN_LEAD')
      ORDER BY al.created_at DESC
    `, [leadId])

    const history = result.rows.map(row => ({
      id: row.id,
      action: row.action,
      description: row.description,
      created_at: row.created_at,
      user_name: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : 'System'
    }))

    console.log(`✅ [REASSIGNMENT] Found ${history.length} reassignment records for lead ${leadId}`)
    return {
      success: true,
      history
    }
  } catch (error: any) {
    console.error("❌ [REASSIGNMENT] Error fetching reassignment history:", error)
    return {
      success: false,
      error: "Failed to fetch reassignment history"
    }
  }
}

// Bulk reassign multiple leads
export async function bulkReassignLeads(
  leadIds: string[],
  employeeId: string,
): Promise<{
  success: boolean
  message?: string
  error?: string
  successCount?: number
  failedCount?: number
}> {
  try {
    console.log(`🔄 [REASSIGNMENT] Bulk reassigning ${leadIds.length} leads to employee ${employeeId} via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get the employee details first
    const employeeResult = await query(`
      SELECT id, first_name, last_name, status
      FROM employees
      WHERE id = $1
    `, [employeeId])

    if (employeeResult.rows.length === 0) {
      return { success: false, error: "Employee not found" }
    }

    const employee = employeeResult.rows[0]

    if (employee.status !== "active") {
      return {
        success: false,
        error: `Cannot reassign leads to inactive employee: ${employee.first_name} ${employee.last_name}`,
      }
    }

    // Update all leads in a single query
    const updateResult = await query(`
      UPDATE leads 
      SET 
        assigned_to = $1,
        updated_at = NOW()
      WHERE id = ANY($2)
      RETURNING id, lead_number
    `, [employeeId, leadIds])

    const successCount = updateResult.rowCount || 0
    const failedCount = leadIds.length - successCount

    // Log activity for each successfully reassigned lead
    for (const lead of updateResult.rows) {
      await logActivity({
        action: "BULK_REASSIGN_LEAD",
        entityType: "lead",
        entityId: lead.id.toString(),
        description: `Lead ${lead.lead_number} bulk reassigned to ${employee.first_name} ${employee.last_name}`,
      })
    }

    // Revalidate paths
    revalidatePath("/sales/manage-lead")
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/unassigned-lead")

    console.log(`✅ [REASSIGNMENT] Bulk reassignment completed: ${successCount} successful, ${failedCount} failed`)

    return {
      success: true,
      message: `Successfully reassigned ${successCount} leads to ${employee.first_name} ${employee.last_name}${failedCount > 0 ? `. ${failedCount} leads failed to reassign.` : ''}`,
      successCount,
      failedCount
    }
  } catch (error: any) {
    console.error("❌ [REASSIGNMENT] Error in bulk reassignment:", error)
    return { success: false, error: "An unexpected error occurred during bulk reassignment" }
  }
}

// Get employee workload for reassignment decisions
export async function getEmployeeWorkload(employeeId: string) {
  try {
    console.log(`📊 [REASSIGNMENT] Fetching workload for employee ${employeeId} via PostgreSQL...`)

    const result = await query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'NEW') as new_leads,
        COUNT(*) FILTER (WHERE status = 'CONTACTED') as contacted_leads,
        COUNT(*) FILTER (WHERE status = 'QUALIFIED') as qualified_leads,
        COUNT(*) FILTER (WHERE status = 'PROPOSAL') as proposal_leads,
        COUNT(*) FILTER (WHERE status = 'NEGOTIATION') as negotiation_leads,
        COUNT(*) FILTER (WHERE status = 'CLOSED_WON') as won_leads,
        COUNT(*) FILTER (WHERE status = 'CLOSED_LOST') as lost_leads,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_leads,
        COUNT(*) FILTER (WHERE status NOT IN ('CLOSED_WON', 'CLOSED_LOST', 'REJECTED')) as active_leads
      FROM leads
      WHERE assigned_to = $1
    `, [employeeId])

    const workload = result.rows[0] || {}

    // Convert string counts to numbers
    Object.keys(workload).forEach(key => {
      workload[key] = parseInt(workload[key]) || 0
    })

    console.log(`✅ [REASSIGNMENT] Employee ${employeeId} workload: ${workload.active_leads} active leads`)

    return {
      success: true,
      workload
    }
  } catch (error: any) {
    console.error("❌ [REASSIGNMENT] Error fetching employee workload:", error)
    return {
      success: false,
      error: "Failed to fetch employee workload"
    }
  }
}
