"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"
import { logActivity } from "@/services/activity-service"
import { triggerLeadAssignmentTasks } from "@/actions/lead-task-integration-hooks"

// Update the updateLeadStatus function to handle rejected leads
export async function updateLeadStatus(
  leadId: number,
  status: string,
  notes?: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`🎯 [LEADS] Updating lead ${leadId} status to ${status}...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // First, get the lead to check if the user is authorized to update it
    const leadResult = await query(`
      SELECT 
        id, 
        lead_number, 
        client_name, 
        assigned_to, 
        status, 
        company_id,
        branch_id
      FROM leads
      WHERE id = $1
    `, [leadId])

    if (leadResult.rows.length === 0) {
      console.error(`❌ [LEADS] Lead ${leadId} not found`)
      return { success: false, message: "Lead not found" }
    }

    const lead = leadResult.rows[0]

    // Check if the user is authorized to update this lead
    if (lead.assigned_to !== currentUser.employeeId) {
      return { success: false, message: "You are not authorized to update this lead" }
    }

    // Check if the rejection_reason column exists
    let hasRejectionColumns = false
    try {
      const columnCheckResult = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'rejection_reason'
      `)
      hasRejectionColumns = columnCheckResult.rows.length > 0
    } catch (error) {
      console.error("❌ [LEADS] Error checking for rejection_reason column:", error)
      // Continue with the assumption that the column might not exist
    }

    // Prepare update data based on status and column existence
    const updateFields = ['status = $2', 'updated_at = $3']
    const updateParams = [leadId, status, new Date().toISOString()]
    let paramIndex = 4

    // If rejecting and columns exist, add rejection data
    if (status === "REJECTED" && hasRejectionColumns) {
      updateFields.push(`rejection_reason = $${paramIndex++}`)
      updateFields.push(`rejected_at = $${paramIndex++}`)
      updateFields.push(`rejected_by = $${paramIndex++}`)
      updateParams.push(
        notes || "No reason provided",
        new Date().toISOString(),
        currentUser.id
      )
    }

    // Update lead status using PostgreSQL
    await query(`
      UPDATE leads 
      SET ${updateFields.join(', ')}
      WHERE id = $1
    `, updateParams)

    // Log the activity regardless of status
    const activityDescription =
      status === "REJECTED"
        ? `Lead rejected. Reason: ${notes || "No reason provided"}`
        : `Lead status updated from ${lead.status} to ${status}`

    await logActivity({
      type: status === "REJECTED" ? "reject" : "update",
      entity_type: "lead",
      entity_id: leadId,
      
      description: activityDescription,
      
    })

    // Revalidate paths
    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/manage-lead")

    console.log(`✅ [LEADS] Lead ${leadId} status updated to ${status}`)
    return { success: true }
  } catch (error) {
    console.error("❌ [LEADS] Error updating lead status:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Add the reassignRejectedLead function
export async function reassignRejectedLead(
  leadId: number,
  newCompanyId: number,
  newBranchId: number | null,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`🔄 [LEADS] Reassigning rejected lead ${leadId}...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // First, get the lead to check if it's rejected
    const leadResult = await query(`
      SELECT 
        l.id, 
        l.lead_number, 
        l.client_name, 
        l.status, 
        l.company_id,
        c.name as company_name,
        l.branch_id,
        b.name as branch_name,
        l.rejection_reason
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      WHERE l.id = $1
    `, [leadId])

    if (leadResult.rows.length === 0) {
      console.error(`❌ [LEADS] Lead ${leadId} not found`)
      return { success: false, message: "Lead not found" }
    }

    const lead = leadResult.rows[0]

    if (lead.status !== "REJECTED") {
      return { success: false, message: "Only rejected leads can be reassigned" }
    }

    // Get the new company name for logging
    const newCompanyResult = await query(`
      SELECT name FROM companies WHERE id = $1
    `, [newCompanyId])

    const newCompanyName = newCompanyResult.rows.length > 0 ? newCompanyResult.rows[0].name : 'Unknown Company'

    // Get the new branch name for logging
    let newBranchName = null
    if (newBranchId) {
      const newBranchResult = await query(`
        SELECT name FROM branches WHERE id = $1
      `, [newBranchId])

      if (newBranchResult.rows.length > 0) {
        newBranchName = newBranchResult.rows[0].name
      }
    }

    // Check if the rejection_reason column exists
    let hasRejectionColumns = false
    try {
      const columnCheckResult = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'rejection_reason'
      `)
      hasRejectionColumns = columnCheckResult.rows.length > 0
    } catch (error) {
      console.error("❌ [LEADS] Error checking for rejection_reason column:", error)
    }

    // Prepare the update data
    const updateFields = ['company_id = $2', 'branch_id = $3', 'status = $4', 'updated_at = $5']
    const updateParams = [leadId, newCompanyId, newBranchId, 'OPEN', new Date().toISOString()]
    let paramIndex = 6

    // Clear rejection data if columns exist
    if (hasRejectionColumns) {
      updateFields.push(`rejection_reason = $${paramIndex++}`)
      updateFields.push(`rejected_at = $${paramIndex++}`)
      updateFields.push(`rejected_by = $${paramIndex++}`)
      updateParams.push(null, null, null)
    }

    // Update the lead using PostgreSQL
    await query(`
      UPDATE leads 
      SET ${updateFields.join(', ')}
      WHERE id = $1
    `, updateParams)

    // Log the activity
    const oldCompanyName = lead.company_name || 'Unknown Company'
    const oldBranchName = lead.branch_name || 'Unknown Branch'
    const activityDescription = `Lead reassigned from ${oldCompanyName}${oldBranchName ? ` (${oldBranchName})` : ''} to ${newCompanyName}${newBranchName ? ` (${newBranchName})` : ''}`

    await logActivity({
      type: "reassign",
      entity_type: "lead",
      entity_id: leadId,
      
      description: activityDescription,
      
    })

    // Revalidate paths
    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/manage-lead")

    console.log(`✅ [LEADS] Lead ${leadId} reassigned successfully`)
    return { success: true }
  } catch (error) {
    console.error("❌ [LEADS] Error reassigning rejected lead:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function assignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  employeeId: number,
  employeeName: string,
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`👤 [LEADS] Assigning lead ${leadId} to employee ${employeeId}...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Update the lead assignment using PostgreSQL
    await query(`
      UPDATE leads 
      SET assigned_to = $1, updated_at = $2
      WHERE id = $3
    `, [employeeId, new Date().toISOString(), leadId])

    // Log the activity
    await logActivity({
      type: "assign",
      entity_type: "lead",
      entity_id: leadId,
      
      description: `Lead assigned to ${employeeName}`,
      
    })

    // Trigger assignment-based tasks
    // TODO: Fix triggerLeadAssignmentTasks call - needs lead data object

    // Revalidate paths
    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/manage-lead")

    console.log(`✅ [LEADS] Lead ${leadId} assigned to ${employeeName}`)
    return { success: true, message: "Lead assigned successfully" }
  } catch (error) {
    console.error("❌ [LEADS] Error assigning lead:", error)
    return { success: false, message: "Failed to assign lead" }
  }
}

export async function deleteLead(leadId: number): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🗑️ [LEADS] Deleting lead ${leadId}...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Get lead details for logging before deletion
    const leadResult = await query(`
      SELECT lead_number, client_name FROM leads WHERE id = $1
    `, [leadId])

    if (leadResult.rows.length === 0) {
      return { success: false, message: "Lead not found" }
    }

    const lead = leadResult.rows[0]

    // Delete the lead using PostgreSQL
    await query(`DELETE FROM leads WHERE id = $1`, [leadId])

    // Log the activity
    await logActivity({
      type: "delete",
      entity_type: "lead",
      entity_id: leadId,
      
      description: `Lead deleted: ${lead.client_name}`,
      
    })

    // Revalidate paths
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/manage-lead")

    console.log(`✅ [LEADS] Lead ${leadId} deleted successfully`)
    return { success: true, message: "Lead deleted successfully" }
  } catch (error) {
    console.error("❌ [LEADS] Error deleting lead:", error)
    return { success: false, message: "Failed to delete lead" }
  }
}

// Schedule a follow-up for a lead
export async function scheduleLeadFollowup(data: {
  leadId: number
  scheduledAt: string
  followupType: string
  notes?: string
  priority: string
  summary?: string
  nextFollowUpDate?: string
  followUpRequired?: boolean
  durationMinutes?: number
}): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    console.log(`📅 [LEADS] Scheduling follow-up for lead ${data.leadId}...`)

    // Get the current user
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "User not authenticated" }
    }

    console.log("📝 [LEADS] Scheduling follow-up with data:", {
      ...data,
      currentUserId: currentUser.id,
    })

    // Insert the follow-up using PostgreSQL
    const followupResult = await query(`
      INSERT INTO lead_followups (
        lead_id, 
        scheduled_at, 
        contact_method, 
        notes, 
        priority, 
        interaction_summary, 
        status, 
        created_by, 
        follow_up_required, 
        next_follow_up_date, 
        duration_minutes, 
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *
    `, [
      data.leadId,
      data.scheduledAt,
      data.followupType,
      data.notes || null,
      data.priority,
      data.summary || null,
      "scheduled",
      currentUser.id ? String(currentUser.id) : null,
      data.followUpRequired || false,
      data.nextFollowUpDate || null,
      data.durationMinutes || null,
      new Date().toISOString()
    ])

    const followup = followupResult.rows[0]

    // Update the lead's last_contacted field using PostgreSQL
    try {
      await query(`
        UPDATE leads 
        SET last_contacted = $1, updated_at = $1
        WHERE id = $2
      `, [new Date().toISOString(), data.leadId])
    } catch (updateError) {
      console.error("⚠️ [LEADS] Error updating lead last_contacted:", updateError)
      // We don't fail the whole operation if just this update fails
    }

    // Revalidate the leads page
    revalidatePath("/sales/my-leads")
    revalidatePath(`/sales/lead/${data.leadId}`)
    revalidatePath("/follow-ups/dashboard")

    console.log(`✅ [LEADS] Follow-up scheduled successfully for lead ${data.leadId}`)
    return {
      success: true,
      message: "Follow-up scheduled successfully",
      data: followup || null,
    }
  } catch (error) {
    console.error("❌ [LEADS] Unexpected error scheduling follow-up:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function sendLeadMessage(
  leadId: number,
  messageType: string,
  subject: string,
  message: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`💬 [LEADS] Sending message to lead ${leadId}...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Insert message using PostgreSQL
    await query(`
      INSERT INTO lead_messages (
        lead_id,
        message_type,
        subject,
        message_body,
        sent_by,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      leadId,
      messageType,
      subject,
      message,
      currentUser.id,
      new Date().toISOString()
    ])

    // Log the activity
    await logActivity({
      type: "send",
      entity_type: "lead_message",
      entity_id: leadId,
      
      description: `Message sent to lead ${leadId} via ${messageType}`,
      
    })

    revalidatePath(`/sales/lead/${leadId}`)
    
    console.log(`✅ [LEADS] Message sent successfully to lead ${leadId}`)
    return { success: true, message: "Message sent successfully" }
  } catch (error) {
    console.error("❌ [LEADS] Error sending message:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function createLead(leadData: {
  company_id: number
  branch_id?: number
  contact_name: string
  email?: string
  country_code: string
  phone: string
  is_whatsapp: boolean
  whatsapp_country_code?: string
  whatsapp_number?: string
  location?: string
  notes?: string
  lead_source?: string
  status?: string
}): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    console.log('📝 [LEADS] Creating new lead via PostgreSQL...')

    // Auto-generate lead number
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const companyCode = leadData.company_id.toString().padStart(2, '0')
    const leadNumber = `LEAD-${companyCode}-${timestamp}`

    // Map contact_name to client_name and adjust other fields
    const insertData = {
      lead_number: leadNumber,
      company_id: leadData.company_id,
      branch_id: leadData.branch_id || null,
      client_name: leadData.contact_name, // Map contact_name to client_name
      email: leadData.email || null,
      country_code: leadData.country_code,
      phone: leadData.phone,
      is_whatsapp: leadData.is_whatsapp,
      has_separate_whatsapp: Boolean(leadData.whatsapp_number && leadData.whatsapp_number !== leadData.phone),
      whatsapp_country_code: leadData.whatsapp_country_code || null,
      whatsapp_number: leadData.whatsapp_number || null,
      location: leadData.location || null,
      notes: leadData.notes || null,
      lead_source_id: null, // Will be set if we have a mapping
      lead_source: leadData.lead_source || null,
      status: leadData.status || 'NEW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 [LEADS] Inserting lead with data:', {
      lead_number: insertData.lead_number,
      client_name: insertData.client_name,
      company_id: insertData.company_id,
      phone: `${insertData.country_code}${insertData.phone}`
    })

    const result = await query(`
      INSERT INTO leads (
        lead_number, company_id, branch_id, client_name, email, 
        country_code, phone, is_whatsapp, has_separate_whatsapp,
        whatsapp_country_code, whatsapp_number, location, notes,
        lead_source_id, lead_source, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      insertData.lead_number,
      insertData.company_id,
      insertData.branch_id,
      insertData.client_name,
      insertData.email,
      insertData.country_code,
      insertData.phone,
      insertData.is_whatsapp,
      insertData.has_separate_whatsapp,
      insertData.whatsapp_country_code,
      insertData.whatsapp_number,
      insertData.location,
      insertData.notes,
      insertData.lead_source_id,
      insertData.lead_source,
      insertData.status,
      insertData.created_at,
      insertData.updated_at
    ])

    const newLead = result.rows[0]

    // Log activity
    try {
      await logActivity({
        type: 'lead_created',
        description: `New lead ${insertData.lead_number} created for ${insertData.client_name}`,
        entity_type: 'lead',
        entity_id: newLead.id
      })
    } catch (logError) {
      console.error('⚠️ [LEADS] Error logging activity:', logError)
      // Don't fail the whole operation if activity logging fails
    }

    console.log(`✅ [LEADS] Lead ${insertData.lead_number} created successfully`)

    return {
      success: true,
      data: newLead,
      message: `Lead ${insertData.lead_number} created successfully`
    }
  } catch (error: any) {
    console.error('❌ [LEADS] Error creating lead:', error)
    
    // Provide more specific error messages
    if (error.message?.includes('not-null constraint')) {
      return {
        success: false,
        message: 'Missing required field. Please check all required fields are filled.'
      }
    }
    
    if (error.message?.includes('duplicate key')) {
      return {
        success: false,
        message: 'A lead with this information already exists.'
      }
    }

    return {
      success: false,
      message: `Failed to create lead: ${error.message}`
    }
  }
}
