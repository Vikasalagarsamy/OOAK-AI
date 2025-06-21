"use server"

import { query } from "@/lib/postgresql-client"

// Get employees for a specific company and branch
export async function getEmployeesByCompanyAndBranch(
  companyId: number,
  branchId: number | null,
  location: string | null,
) {
  try {
    console.log(`👥 [LEAD_REASSIGNMENT] Fetching employees for company ${companyId}, branch ${branchId || 'any'} via PostgreSQL...`)

    // First, get branch location if we have a branch ID
    let branchLocation = null
    if (branchId) {
      console.log(`🔍 [LEAD_REASSIGNMENT] Looking up branch location for branch ${branchId}...`)
      const branchResult = await query(`
        SELECT location FROM branches WHERE id = $1
      `, [branchId])

      if (branchResult.rows.length > 0) {
        branchLocation = branchResult.rows[0].location
        console.log(`📍 [LEAD_REASSIGNMENT] Found branch location: ${branchLocation}`)
      }
    }

    // Use provided location or branch location
    const effectiveLocation = location || branchLocation

    // Build the query with proper joins
    let queryText = `
      SELECT 
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.job_title,
        e.status,
        ec.company_id,
        ec.branch_id,
        ec.is_primary,
        ec.allocation_percentage
      FROM employees e
      INNER JOIN employee_companies ec ON e.id = ec.employee_id
      WHERE ec.company_id = $1
      AND e.status = 'ACTIVE'
    `

    const params: any[] = [companyId]

    // Add branch filter if provided
    if (branchId) {
      queryText += ` AND ec.branch_id = $${params.length + 1}`
      params.push(branchId)
    }

    queryText += ` ORDER BY e.first_name ASC`

    console.log(`🔍 [LEAD_REASSIGNMENT] Executing employee query...`)
    const result = await query(queryText, params)

    // Transform the data to flatten the structure
    const employees = result.rows.map((emp) => {
      // Calculate role from job_title - use a default if null
      const role = emp.job_title || "Sales Representative"

      // Determine if this is a sales role - be more inclusive
      const isSalesRole = true // Include all employees as potential assignees

      return {
        id: emp.id,
        employee_id: emp.employee_id || `EMP-${emp.id}`,
        first_name: emp.first_name || "",
        last_name: emp.last_name || "",
        full_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${emp.id}`,
        role: role,
        company_id: emp.company_id,
        branch_id: emp.branch_id,
        location: effectiveLocation, // Use the effective location
        allocation_percentage: emp.allocation_percentage,
        is_sales_role: isSalesRole,
      }
    })

    console.log(`✅ [LEAD_REASSIGNMENT] Found ${employees.length} employees for company ${companyId}, branch ${branchId || "any"}`)
    return employees
  } catch (error: any) {
    console.error("❌ [LEAD_REASSIGNMENT] Exception in getEmployeesByCompanyAndBranch:", error)
    return []
  }
}

// Get all active employees for lead assignment
export async function getAllActiveEmployees() {
  try {
    console.log("👥 [LEAD_REASSIGNMENT] Fetching all active employees via PostgreSQL...")

    const result = await query(`
      SELECT 
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.job_title,
        e.status,
        e.department,
        ec.company_id,
        ec.branch_id,
        ec.allocation_percentage,
        c.name as company_name,
        b.name as branch_name,
        b.location as branch_location
      FROM employees e
      LEFT JOIN employee_companies ec ON e.id = ec.employee_id AND ec.is_primary = true
      LEFT JOIN companies c ON ec.company_id = c.id
      LEFT JOIN branches b ON ec.branch_id = b.id
      WHERE e.status = 'ACTIVE'
      ORDER BY e.first_name ASC, e.last_name ASC
    `)

    const employees = result.rows.map((emp) => ({
      id: emp.id,
      employee_id: emp.employee_id || `EMP-${emp.id}`,
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      full_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${emp.id}`,
      role: emp.job_title || "Employee",
      department: emp.department,
      company_id: emp.company_id,
      company_name: emp.company_name,
      branch_id: emp.branch_id,
      branch_name: emp.branch_name,
      location: emp.branch_location,
      allocation_percentage: emp.allocation_percentage,
      is_sales_role: true, // Include all active employees as potential assignees
    }))

    console.log(`✅ [LEAD_REASSIGNMENT] Found ${employees.length} active employees`)
    return employees
  } catch (error: any) {
    console.error("❌ [LEAD_REASSIGNMENT] Exception in getAllActiveEmployees:", error)
    return []
  }
}

// Get employee workload for assignment optimization
export async function getEmployeeWorkload(employeeId: number) {
  try {
    console.log(`📊 [LEAD_REASSIGNMENT] Fetching workload for employee ${employeeId} via PostgreSQL...`)

    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'NEW') as new_leads,
        COUNT(*) FILTER (WHERE status = 'CONTACTED') as contacted_leads,
        COUNT(*) FILTER (WHERE status = 'QUALIFIED') as qualified_leads,
        COUNT(*) FILTER (WHERE status = 'PROPOSAL') as proposal_leads,
        COUNT(*) FILTER (WHERE status = 'NEGOTIATION') as negotiation_leads,
        COUNT(*) FILTER (WHERE status = 'CLOSED_WON') as won_leads,
        COUNT(*) FILTER (WHERE status = 'CLOSED_LOST') as lost_leads,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_leads,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status NOT IN ('CLOSED_WON', 'CLOSED_LOST', 'REJECTED')) as active_leads
      FROM leads
      WHERE assigned_to = $1
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [employeeId])

    const workload = result.rows[0] || {
      new_leads: 0,
      contacted_leads: 0,
      qualified_leads: 0,
      proposal_leads: 0,
      negotiation_leads: 0,
      won_leads: 0,
      lost_leads: 0,
      rejected_leads: 0,
      total_leads: 0,
      active_leads: 0
    }

    // Convert string counts to numbers
    Object.keys(workload).forEach(key => {
      workload[key] = parseInt(workload[key]) || 0
    })

    console.log(`✅ [LEAD_REASSIGNMENT] Employee ${employeeId} has ${workload.active_leads} active leads`)
    return workload
  } catch (error: any) {
    console.error("❌ [LEAD_REASSIGNMENT] Exception in getEmployeeWorkload:", error)
    return {
      new_leads: 0,
      contacted_leads: 0,
      qualified_leads: 0,
      proposal_leads: 0,
      negotiation_leads: 0,
      won_leads: 0,
      lost_leads: 0,
      rejected_leads: 0,
      total_leads: 0,
      active_leads: 0
    }
  }
}

// Reassign lead to a new employee
export async function reassignLead(leadId: number, newEmployeeId: number, reason?: string) {
  try {
    console.log(`🔄 [LEAD_REASSIGNMENT] Reassigning lead ${leadId} to employee ${newEmployeeId} via PostgreSQL...`)

    // Update the lead assignment
    const result = await query(`
      UPDATE leads 
      SET 
        assigned_to = $1,
        updated_at = NOW(),
        reassignment_reason = $2
      WHERE id = $3
      RETURNING id, lead_number, client_name, assigned_to
    `, [newEmployeeId, reason || 'Manual reassignment', leadId])

    if (result.rowCount === 0) {
      return {
        success: false,
        message: "Lead not found or could not be updated"
      }
    }

    const updatedLead = result.rows[0]

    // Log the reassignment
    await query(`
      INSERT INTO lead_activity_logs (
        lead_id,
        activity_type,
        description,
        created_at
      ) VALUES (
        $1,
        'REASSIGNMENT',
        $2,
        NOW()
      )
    `, [
      leadId,
      `Lead reassigned to employee ${newEmployeeId}. Reason: ${reason || 'Manual reassignment'}`
    ])

    console.log(`✅ [LEAD_REASSIGNMENT] Successfully reassigned lead ${updatedLead.lead_number}`)
    return {
      success: true,
      message: `Lead ${updatedLead.lead_number} successfully reassigned`,
      lead: updatedLead
    }
  } catch (error: any) {
    console.error("❌ [LEAD_REASSIGNMENT] Exception in reassignLead:", error)
    return {
      success: false,
      message: `Failed to reassign lead: ${error.message}`
    }
  }
}

// Bulk reassign multiple leads
export async function bulkReassignLeads(leadIds: number[], newEmployeeId: number, reason?: string) {
  try {
    console.log(`🔄 [LEAD_REASSIGNMENT] Bulk reassigning ${leadIds.length} leads to employee ${newEmployeeId} via PostgreSQL...`)

    // Update multiple leads
    const result = await query(`
      UPDATE leads 
      SET 
        assigned_to = $1,
        updated_at = NOW(),
        reassignment_reason = $2
      WHERE id = ANY($3)
      RETURNING id, lead_number, client_name
    `, [newEmployeeId, reason || 'Bulk reassignment', leadIds])

    const updatedLeads = result.rows

    // Log the bulk reassignment
    for (const lead of updatedLeads) {
      await query(`
        INSERT INTO lead_activity_logs (
          lead_id,
          activity_type,
          description,
          created_at
        ) VALUES (
          $1,
          'REASSIGNMENT',
          $2,
          NOW()
        )
      `, [
        lead.id,
        `Lead bulk reassigned to employee ${newEmployeeId}. Reason: ${reason || 'Bulk reassignment'}`
      ])
    }

    console.log(`✅ [LEAD_REASSIGNMENT] Successfully bulk reassigned ${updatedLeads.length} leads`)
    return {
      success: true,
      message: `Successfully reassigned ${updatedLeads.length} leads`,
      updatedLeads: updatedLeads
    }
  } catch (error: any) {
    console.error("❌ [LEAD_REASSIGNMENT] Exception in bulkReassignLeads:", error)
    return {
      success: false,
      message: `Failed to bulk reassign leads: ${error.message}`
    }
  }
}
