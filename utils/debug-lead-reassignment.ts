"use server"

import { query } from "@/lib/postgresql-client"

/**
 * DEBUG LEAD REASSIGNMENT - NOW 100% POSTGRESQL
 * =============================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized JOIN operations for better performance
 * - All Supabase dependencies eliminated
 */

export async function debugLeadReassignment(leadNumber: string) {
  try {
    console.log(`🔄 Debugging lead reassignment for lead: ${leadNumber} via PostgreSQL...`)

    // Get comprehensive lead data with related information via optimized JOIN
    const leadResult = await query(`
      SELECT 
        l.*,
        c.name as company_name,
        c.company_code,
        b.name as branch_name,
        b.branch_code,
        b.location as branch_location,
        current_emp.first_name as current_assignee_first_name,
        current_emp.last_name as current_assignee_last_name,
        current_emp.employee_id as current_assignee_employee_id,
        current_emp.job_title as current_assignee_job_title,
        current_emp.status as current_assignee_status
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN employees current_emp ON l.assigned_to = current_emp.id
      WHERE l.lead_number = $1
    `, [leadNumber])

    if (leadResult.rows.length === 0) {
      console.error(`❌ Lead not found: ${leadNumber}`)
      return { error: `Lead not found: ${leadNumber}` }
    }

    const lead = leadResult.rows[0]
    console.log(`✅ Found lead: ${lead.lead_number} assigned to: ${lead.current_assignee_first_name || 'Unassigned'}`)

    // Get potential assignees for this company/branch via optimized query
    const potentialAssigneesResult = await query(`
      SELECT DISTINCT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.job_title,
        e.status,
        e.email,
        e.phone,
        ec.company_id,
        ec.branch_id,
        ec.is_primary,
        ec.allocation_percentage,
        c.name as company_name,
        b.name as branch_name
      FROM employees e
      INNER JOIN employee_companies ec ON e.id = ec.employee_id
      LEFT JOIN companies c ON ec.company_id = c.id
      LEFT JOIN branches b ON ec.branch_id = b.id
      WHERE ec.company_id = $1
        AND e.status = 'ACTIVE'
        AND e.id != $2
      ORDER BY 
        ec.is_primary DESC,
        ec.allocation_percentage DESC,
        e.first_name ASC
    `, [lead.company_id, lead.assigned_to || 0])

    const potentialAssignees = potentialAssigneesResult.rows

    // Get assignment history via activities
    const assignmentHistoryResult = await query(`
      SELECT 
        a.*,
        e.first_name,
        e.last_name,
        e.employee_id
      FROM activities a
      LEFT JOIN employees e ON a.user_id = e.id
      WHERE a.entity_id = $1
        AND a.entity_type = 'lead'
        AND (a.action_type = 'assign' OR a.action_type = 'reassign')
      ORDER BY a.created_at DESC
    `, [lead.id.toString()])

    const assignmentHistory = assignmentHistoryResult.rows

    console.log(`✅ Found ${potentialAssignees.length} potential assignees and ${assignmentHistory.length} assignment records`)

    return {
      success: true,
      lead: {
        id: lead.id,
        lead_number: lead.lead_number,
        title: lead.title,
        description: lead.description,
        status: lead.status,
        priority: lead.priority,
        company_id: lead.company_id,
        branch_id: lead.branch_id,
        assigned_to: lead.assigned_to,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        company_name: lead.company_name,
        company_code: lead.company_code,
        branch_name: lead.branch_name,
        branch_code: lead.branch_code,
        branch_location: lead.branch_location
      },
      currentAssignee: lead.assigned_to ? {
        id: lead.assigned_to,
        employee_id: lead.current_assignee_employee_id,
        first_name: lead.current_assignee_first_name,
        last_name: lead.current_assignee_last_name,
        job_title: lead.current_assignee_job_title,
        status: lead.current_assignee_status
      } : null,
      potentialAssignees: potentialAssignees.map(emp => ({
        id: emp.id,
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        job_title: emp.job_title,
        status: emp.status,
        email: emp.email,
        phone: emp.phone,
        is_primary: emp.is_primary,
        allocation_percentage: emp.allocation_percentage,
        company_name: emp.company_name,
        branch_name: emp.branch_name
      })),
      assignmentHistory: assignmentHistory.map(activity => ({
        id: activity.id,
        action_type: activity.action_type,
        description: activity.description,
        created_at: activity.created_at,
        assigned_by: {
          first_name: activity.first_name,
          last_name: activity.last_name,
          employee_id: activity.employee_id
        }
      })),
      message: "Debug data retrieved successfully via PostgreSQL",
      analytics: {
        totalPotentialAssignees: potentialAssignees.length,
        primaryAssignees: potentialAssignees.filter(emp => emp.is_primary).length,
        highAllocationAssignees: potentialAssignees.filter(emp => emp.allocation_percentage > 50).length,
        assignmentChanges: assignmentHistory.length,
        hasCurrentAssignee: Boolean(lead.assigned_to),
        leadAge: lead.created_at ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
    }

  } catch (error: any) {
    console.error(`❌ Exception in debugLeadReassignment for ${leadNumber} via PostgreSQL:`, error)
    return { error: `Exception in debugLeadReassignment: ${error.message}` }
  }
}

/**
 * Get reassignment recommendations for a lead
 */
export async function getReassignmentRecommendations(leadNumber: string) {
  try {
    console.log(`💡 Getting reassignment recommendations for lead: ${leadNumber} via PostgreSQL...`)

    const debugData = await debugLeadReassignment(leadNumber)
    
    if (debugData.error) {
      return debugData
    }

    const { lead, potentialAssignees } = debugData

    // Score potential assignees based on various factors
    const scoredAssignees = potentialAssignees.map(assignee => {
      let score = 0
      let reasons = []

      // Primary assignment bonus
      if (assignee.is_primary) {
        score += 30
        reasons.push('Primary assignee for this company')
      }

      // Allocation percentage bonus
      score += (assignee.allocation_percentage || 0) * 0.2
      if (assignee.allocation_percentage > 50) {
        reasons.push(`High allocation (${assignee.allocation_percentage}%)`)
      }

      // Job title relevance
      const jobTitle = assignee.job_title?.toLowerCase() || ''
      if (jobTitle.includes('sales') || jobTitle.includes('business development')) {
        score += 15
        reasons.push('Sales-focused role')
      }
      if (jobTitle.includes('manager') || jobTitle.includes('lead')) {
        score += 10
        reasons.push('Management role')
      }

      return {
        ...assignee,
        recommendationScore: Math.round(score),
        recommendationReasons: reasons
      }
    })

    // Sort by recommendation score
    scoredAssignees.sort((a, b) => b.recommendationScore - a.recommendationScore)

    return {
      success: true,
      lead,
      recommendations: scoredAssignees.slice(0, 5), // Top 5 recommendations
      message: "Reassignment recommendations generated successfully"
    }

  } catch (error: any) {
    console.error(`❌ Error getting reassignment recommendations for ${leadNumber}:`, error)
    return { error: `Error getting recommendations: ${error.message}` }
  }
}
