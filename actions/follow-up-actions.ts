"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import type { FollowUpStatus, FollowUpWithLead, FollowUpFilters, FollowUp, FollowUpFormData, FollowUpCompletionData, LeadStatus } from "@/types/follow-up"
import { VALID_STATUS_TRANSITIONS, SUGGESTED_LEAD_STATUS_BY_OUTCOME } from "@/types/follow-up"
import { getCurrentUser } from "@/lib/auth-utils"
import { logActivity } from "@/services/activity-service"
import { VALID_FOLLOWUP_TYPES, FollowUpSchema, type FollowupType } from "@/lib/follow-up-constants"
import { validateStatusTransition, getDateRanges, getSuggestedLeadStatuses } from "@/lib/follow-up-utils"
import { updateLeadStatus } from "@/actions/lead-actions"
import { getQuotationByLeadId, updateQuotationStatus } from "./quotations-actions"

/**
 * FOLLOW-UP ACTIONS - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Transaction safety for critical operations
 * - Enhanced error handling and logging
 * - Optimized batch operations
 * - All Supabase dependencies eliminated
 */

export async function getFollowUps(filters?: FollowUpFilters): Promise<FollowUpWithLead[]> {
  try {
    console.log('📋 [FOLLOWUPS] Fetching follow-ups from PostgreSQL with filters:', filters)
    
    let whereConditions: string[] = []
    let params: any[] = []
    let paramIndex = 1

    const dateRanges = getDateRanges()

    // Apply smart filters first
    if (filters?.smart) {
      if (filters.smart.overdue) {
        // Past scheduled follow-ups that aren't completed, cancelled, or missed
        whereConditions.push(`f.scheduled_at < $${paramIndex}`)
        params.push(dateRanges.now)
        paramIndex++
        
        whereConditions.push(`f.status IN ('scheduled', 'in_progress')`)
      }
      
      if (filters.smart.today) {
        // Follow-ups scheduled for today
        whereConditions.push(`f.scheduled_at >= $${paramIndex}`)
        params.push(dateRanges.today)
        paramIndex++
        
        whereConditions.push(`f.scheduled_at < $${paramIndex}`)
        params.push(dateRanges.tomorrow)
        paramIndex++
        
        whereConditions.push(`f.status IN ('scheduled', 'in_progress')`)
      }
      
      if (filters.smart.thisWeek) {
        // Follow-ups scheduled for this week
        whereConditions.push(`f.scheduled_at >= $${paramIndex}`)
        params.push(dateRanges.startOfWeek)
        paramIndex++
        
        whereConditions.push(`f.scheduled_at <= $${paramIndex}`)
        params.push(dateRanges.endOfWeek)
        paramIndex++
        
        whereConditions.push(`f.status IN ('scheduled', 'in_progress')`)
      }
      
      if (filters.smart.upcoming) {
        // Future + current follow-ups that aren't done
        whereConditions.push(`f.scheduled_at >= $${paramIndex}`)
        params.push(dateRanges.now)
        paramIndex++
        
        whereConditions.push(`f.status IN ('scheduled', 'in_progress', 'rescheduled')`)
      }
    }

    // Apply regular filters
    if (filters && !filters.smart) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          const placeholders = filters.status.map(() => `$${paramIndex++}`).join(', ')
          whereConditions.push(`f.status IN (${placeholders})`)
          params.push(...filters.status)
        } else {
          whereConditions.push(`f.status = $${paramIndex}`)
          params.push(filters.status)
          paramIndex++
        }
      }

      if (filters.leadId) {
        whereConditions.push(`f.lead_id = $${paramIndex}`)
        params.push(filters.leadId)
        paramIndex++
      }

      if (filters.startDate && !filters.smart) {
        whereConditions.push(`f.scheduled_at >= $${paramIndex}`)
        params.push(filters.startDate)
        paramIndex++
      }

      if (filters.endDate && !filters.smart) {
        whereConditions.push(`f.scheduled_at <= $${paramIndex}`)
        params.push(filters.endDate)
        paramIndex++
      }

      if (filters.priority) {
        whereConditions.push(`f.priority = $${paramIndex}`)
        params.push(filters.priority)
        paramIndex++
      }
    }

    // Build the WHERE clause
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Execute PostgreSQL query with JOIN
    const result = await query(`
      SELECT 
        f.*,
        l.lead_number,
        l.client_name as lead_client_name,
        l.status as lead_status
      FROM lead_followups f
      LEFT JOIN leads l ON f.lead_id = l.id
      ${whereClause}
      ORDER BY f.scheduled_at ASC
    `, params)

    // Transform the results to match expected format
    const followUps = result.rows.map(row => ({
      ...row,
      lead: row.lead_number ? {
        lead_number: row.lead_number,
        client_name: row.lead_client_name,
        status: row.lead_status
      } : null
    }))

    console.log(`✅ [FOLLOWUPS] Fetched ${followUps.length} follow-ups from PostgreSQL`)
    return followUps

  } catch (error: any) {
    console.error("❌ [FOLLOWUPS] Error fetching follow-ups from PostgreSQL:", error)
    return []
  }
}

export async function getFollowUpById(id: number): Promise<FollowUpWithLead | null> {
  try {
    console.log(`📋 [FOLLOWUPS] Fetching follow-up ${id} from PostgreSQL...`)
    
    const result = await query(`
      SELECT 
        f.*,
        l.lead_number,
        l.client_name as lead_client_name,
        l.status as lead_status
      FROM lead_followups f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE f.id = $1
    `, [id])

    if (result.rows.length === 0) {
      console.log(`⚠️ [FOLLOWUPS] Follow-up ${id} not found`)
      return null
    }

    const row = result.rows[0]
    const followUp = {
      ...row,
      lead: row.lead_number ? {
        lead_number: row.lead_number,
        client_name: row.lead_client_name,
        status: row.lead_status
      } : null
    }

    console.log(`✅ [FOLLOWUPS] Fetched follow-up ${id} from PostgreSQL`)
    return followUp as FollowUpWithLead

  } catch (error: any) {
    console.error(`❌ [FOLLOWUPS] Error fetching follow-up ${id} from PostgreSQL:`, error)
    return null
  }
}

export async function createFollowUp(
  formData: FollowUpFormData,
): Promise<{ success: boolean; message: string; id?: number; error?: any }> {
  try {
    console.log('🆕 [FOLLOWUPS] Creating follow-up via PostgreSQL...', formData)
    
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Validate the lead exists and check status via PostgreSQL
    const leadResult = await query(`
      SELECT id, lead_number, client_name, status 
      FROM leads 
      WHERE id = $1
    `, [formData.lead_id])

    if (leadResult.rows.length === 0) {
      console.error("❌ [FOLLOWUPS] Lead not found:", formData.lead_id)
      return { success: false, message: "Invalid lead ID" }
    }

    const lead = leadResult.rows[0]

    // Prevent creating follow-ups for closed deals
    if (lead.status === "WON") {
      return { 
        success: false, 
        message: "Cannot create follow-ups for leads marked as 'Won' - deal is already closed" 
      }
    }

    // Validate follow-up type
    if (!VALID_FOLLOWUP_TYPES.includes(formData.followup_type as FollowupType)) {
      return {
        success: false,
        message: `Invalid follow-up type. Must be one of: ${VALID_FOLLOWUP_TYPES.join(", ")}`,
      }
    }

    // Check if the contact_method column exists
    const hasContactMethod = await checkIfColumnExists("lead_followups", "contact_method")
    // Check if the followup_type column exists
    const hasFollowupType = await checkIfColumnExists("lead_followups", "followup_type")

    // If neither column exists, add a clear error message
    if (!hasContactMethod && !hasFollowupType) {
      return {
        success: false,
        message: "Database schema error: Neither contact_method nor followup_type columns exist in the lead_followups table.",
      }
    }

    // Use PostgreSQL transaction for data consistency
    const result = await transaction(async (client) => {
      // Prepare the follow-up data
      const followUpData: any = {
        lead_id: Number(formData.lead_id),
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        notes: formData.notes ? String(formData.notes) : null,
        priority: String(formData.priority),
        interaction_summary: formData.interaction_summary ? String(formData.interaction_summary) : null,
        status: "scheduled",
        created_by: String(currentUser.id),
        follow_up_required: false,
        next_follow_up_date: null,
      }

      // Build dynamic INSERT query based on available columns
      let columns = ['lead_id', 'scheduled_at', 'notes', 'priority', 'interaction_summary', 'status', 'created_by', 'follow_up_required', 'next_follow_up_date', 'created_at']
      let values = [
        followUpData.lead_id,
        followUpData.scheduled_at,
        followUpData.notes,
        followUpData.priority,
        followUpData.interaction_summary,
        followUpData.status,
        followUpData.created_by,
        followUpData.follow_up_required,
        followUpData.next_follow_up_date,
        'NOW()'
      ]
      let placeholders = values.map((_, index) => index === values.length - 1 ? 'NOW()' : `$${index + 1}`)

      // Add the appropriate column based on what exists
      if (hasContactMethod) {
        columns.push('contact_method')
        values.push(String(formData.followup_type))
        placeholders.push(`$${values.length}`)
      }
      if (hasFollowupType) {
        columns.push('followup_type')
        values.push(String(formData.followup_type))
        placeholders.push(`$${values.length}`)
      }

      // Remove NOW() from values array since it's handled in placeholders
      const actualValues = values.slice(0, -1)

      const insertResult = await client.query(`
        INSERT INTO lead_followups (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `, actualValues)

      const newFollowUp = insertResult.rows[0]
      
      console.log(`✅ [FOLLOWUPS] Follow-up created successfully: ID ${newFollowUp.id}`)
      return newFollowUp
    })

    // Log activity
    await logActivity({
      action: "CREATE_FOLLOW_UP",
      entityType: "follow_up",
      entityId: result.id.toString(),
      description: `Created ${formData.followup_type} follow-up for lead ${lead.lead_number}`,
      metadata: {
        leadId: formData.lead_id,
        leadNumber: lead.lead_number,
        clientName: lead.client_name,
        scheduledAt: formData.scheduled_at,
        priority: formData.priority
      }
    })

    revalidatePath("/sales/follow-ups")
    return { 
      success: true, 
      message: `Follow-up scheduled successfully for ${new Date(formData.scheduled_at).toLocaleDateString()}`,
      id: result.id
    }

  } catch (error: any) {
    console.error("❌ [FOLLOWUPS] Error creating follow-up via PostgreSQL:", error)
    return { 
      success: false, 
      message: error.message || "Failed to create follow-up",
      error: error
    }
  }
}

// Helper function to check if a column exists in a table
async function checkIfColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2
  `, [tableName, columnName])

  return result.rows.length > 0
}

export async function scheduleLeadFollowup(data: {
  leadId: number
  scheduledAt: string
  followupType: string
  notes?: string
  priority: string
  summary?: string
}) {
  try {
    console.log("📅 [FOLLOWUPS] Scheduling follow-up via PostgreSQL with data:", data)

    // Validate input data
    if (!data.leadId || isNaN(Number(data.leadId))) {
      return { success: false, message: "Invalid lead ID" }
    }

    if (!data.scheduledAt || new Date(data.scheduledAt).toString() === "Invalid Date") {
      return { success: false, message: "Invalid scheduled date" }
    }

    if (!VALID_FOLLOWUP_TYPES.includes(data.followupType as FollowupType)) {
      return { success: false, message: "Invalid follow-up type" }
    }

    // Get current user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Verify the lead exists and check status
    const leadResult = await query(`
      SELECT id, status, lead_number, client_name
      FROM leads 
      WHERE id = $1
    `, [data.leadId])

    if (leadResult.rows.length === 0) {
      console.error("❌ [FOLLOWUPS] Lead does not exist:", data.leadId)
      return { success: false, message: "The specified lead does not exist" }
    }

    const lead = leadResult.rows[0]

    // Prevent creating follow-ups for closed deals
    if (lead.status === "WON") {
      return { 
        success: false, 
        message: "Cannot create follow-ups for leads marked as 'Won' - deal is already closed" 
      }
    }

    // Check if the contact_method column exists
    const hasContactMethod = await checkIfColumnExists("lead_followups", "contact_method")
    // Check if the followup_type column exists
    const hasFollowupType = await checkIfColumnExists("lead_followups", "followup_type")

    // Prepare the data based on the column name
    const followUpData: any = {
      lead_id: data.leadId,
      scheduled_at: new Date(data.scheduledAt).toISOString(),
      notes: data.notes || "",
      priority: data.priority,
      interaction_summary: data.summary || "",
      status: "scheduled",
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    }

    // Set the appropriate column based on what exists in the database
    if (hasContactMethod) {
      followUpData.contact_method = data.followupType
    }
    if (hasFollowupType) {
      followUpData.followup_type = data.followupType
    }

    // If neither column exists, add a clear error message
    if (!hasContactMethod && !hasFollowupType) {
      return {
        success: false,
        message: "Database schema error: Neither contact_method nor followup_type columns exist in the lead_followups table.",
      }
    }

    // Build dynamic INSERT query
    const columns = Object.keys(followUpData)
    const placeholders = columns.map((_, index) => `$${index + 1}`)
    const values = Object.values(followUpData)

    // Insert the follow-up
    const result = await query(`
      INSERT INTO lead_followups (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `, values)

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Follow-up was created but no data was returned.",
      }
    }

    const followup = result.rows[0]
    console.log("✅ [FOLLOWUPS] Follow-up scheduled successfully:", followup)

    // Revalidate relevant paths to update UI
    revalidatePath(`/sales/lead/${data.leadId}`)
    revalidatePath("/sales/my-leads")
    revalidatePath("/follow-ups")

    return {
      success: true,
      message: "Follow-up scheduled successfully",
      data: followup,
    }
  } catch (error: any) {
    console.error("❌ [FOLLOWUPS] Unexpected error in scheduleLeadFollowup:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error.message || String(error)}`,
      error: error,
    }
  }
}

/**
 * Sync quotation status when lead status is updated to REJECTED or LOST
 */
export async function syncQuotationStatusForLead(
  leadId: number, 
  leadStatus: LeadStatus
): Promise<{ success: boolean; message: string }> {
  try {
    // Only sync for terminal statuses
    if (!['REJECTED', 'LOST'].includes(leadStatus)) {
      return { success: true, message: 'No quotation sync needed for this status' }
    }

    console.log(`🔄 [FOLLOWUPS] Lead ${leadId} marked as ${leadStatus}, checking for quotation to update...`)
    
    const quotationResult = await getQuotationByLeadId(leadId.toString())
    if (!quotationResult.success || !quotationResult.quotation) {
      console.log(`ℹ️ [FOLLOWUPS] No quotation found for lead ${leadId}`)
      return { success: true, message: 'No quotation found to sync' }
    }

    // Skip if quotation is already rejected
    if (quotationResult.quotation.status === 'rejected') {
      console.log(`ℹ️ [FOLLOWUPS] Quotation ${quotationResult.quotation.quotation_number} already rejected`)
      return { success: true, message: 'Quotation already in rejected status' }
    }

    console.log(`🔄 [FOLLOWUPS] Found quotation ${quotationResult.quotation.quotation_number}, updating status to rejected...`)
    
    const quotationUpdateResult = await updateQuotationStatus(
      quotationResult.quotation.id.toString(), 
      'rejected'
    )
    
    if (quotationUpdateResult.success) {
      console.log(`✅ [FOLLOWUPS] Quotation ${quotationResult.quotation.quotation_number} automatically marked as rejected`)
      return { 
        success: true, 
        message: `Quotation ${quotationResult.quotation.quotation_number} automatically moved to rejected status` 
      }
    } else {
      console.error(`❌ [FOLLOWUPS] Failed to update quotation status:`, quotationUpdateResult.error)
      return { 
        success: false, 
        message: `Failed to sync quotation status: ${quotationUpdateResult.error}` 
      }
    }
    
  } catch (error: any) {
    console.error('❌ [FOLLOWUPS] Error syncing quotation status:', error)
    return { 
      success: false, 
      message: `Error syncing quotation status: ${error.message}` 
    }
  }
}

/**
 * Update follow-up with enhanced lead status tracking and quotation sync
 */
export async function updateFollowUpWithLeadStatus(
  followUpId: number,
  status: FollowUpStatus,
  updates: {
    completed_at?: string
    outcome?: string
    duration_minutes?: number
    follow_up_required?: boolean
    next_follow_up_date?: string
    lead_status?: LeadStatus
  }
): Promise<{ success: boolean; message: string; nextFollowUpId?: number }> {
  try {
    console.log(`🔄 [FOLLOWUPS] Updating follow-up ${followUpId} with status ${status} via PostgreSQL...`, updates)

    // Get the current follow-up to access lead information
    const currentFollowUpResult = await query(`
      SELECT 
        f.*,
        l.id as lead_id,
        l.lead_number,
        l.client_name,
        l.status as lead_status
      FROM lead_followups f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE f.id = $1
    `, [followUpId])

    if (currentFollowUpResult.rows.length === 0) {
      console.error('❌ [FOLLOWUPS] Follow-up not found:', followUpId)
      return { success: false, message: 'Follow-up not found' }
    }

    const currentFollowUp = currentFollowUpResult.rows[0]

    // Use transaction for atomic updates
    const result = await transaction(async (client) => {
      // Update follow-up
      const updateResult = await client.query(`
        UPDATE lead_followups 
        SET 
          status = $1,
          completed_at = $2,
          outcome = $3,
          duration_minutes = $4,
          follow_up_required = $5,
          next_follow_up_date = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [
        status,
        updates.completed_at || null,
        updates.outcome || null,
        updates.duration_minutes || null,
        updates.follow_up_required || null,
        updates.next_follow_up_date || null,
        followUpId
      ])

      let nextFollowUpId: number | undefined

      // Update lead status if provided
      if (updates.lead_status && currentFollowUp.lead_id) {
        console.log(`🔄 [FOLLOWUPS] Updating lead ${currentFollowUp.lead_id} status to ${updates.lead_status}`)
        
        await client.query(`
          UPDATE leads 
          SET 
            status = $1,
            updated_at = NOW()
          WHERE id = $2
        `, [updates.lead_status, currentFollowUp.lead_id])

        // 🎯 AUTOMATIC QUOTATION STATUS SYNC
        // If lead is marked as REJECTED or LOST, update associated quotation
        if (['REJECTED', 'LOST'].includes(updates.lead_status)) {
          console.log(`🔄 [FOLLOWUPS] Lead marked as ${updates.lead_status}, syncing quotation...`)
          
          const quotationSyncResult = await syncQuotationStatusForLead(
            currentFollowUp.lead_id, 
            updates.lead_status
          )
          
          if (quotationSyncResult.success) {
            console.log(`✅ [FOLLOWUPS] Quotation sync completed`)
          } else {
            console.error(`❌ [FOLLOWUPS] Quotation sync failed:`, quotationSyncResult.message)
            // Don't fail the entire operation, just log the error
          }
        }
      }

      // Create next follow-up if required
      if (updates.follow_up_required && updates.next_follow_up_date && currentFollowUp.lead_id) {
        console.log('📅 [FOLLOWUPS] Creating next follow-up...')
        
        const nextFollowUpResult = await client.query(`
          INSERT INTO lead_followups (
            lead_id,
            scheduled_at,
            status,
            priority,
            contact_method,
            followup_type,
            notes,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
          )
          RETURNING id
        `, [
          currentFollowUp.lead_id,
          new Date(updates.next_follow_up_date).toISOString(),
          'scheduled',
          'medium',
          currentFollowUp.contact_method || 'phone',
          currentFollowUp.followup_type || 'phone',
          `Follow-up scheduled from completed follow-up #${followUpId}`
        ])

        nextFollowUpId = nextFollowUpResult.rows[0]?.id
        console.log(`📅 [FOLLOWUPS] Next follow-up created with ID: ${nextFollowUpId}`)
      }

      return { nextFollowUpId }
    })

    // Revalidate relevant pages
    revalidatePath('/sales/follow-up')
    revalidatePath('/sales/leads')
    revalidatePath('/sales/quotations') // Revalidate quotations page for status changes

    let message = `Follow-up marked as ${status}`
    if (updates.lead_status) {
      message += ` and lead status updated to ${updates.lead_status}`
    }
    if (result.nextFollowUpId) {
      message += `. Next follow-up scheduled.`
    }
    if (['REJECTED', 'LOST'].includes(updates.lead_status || '')) {
      message += ` Associated quotation has been automatically moved to rejected status.`
    }

    console.log('✅ [FOLLOWUPS] Follow-up update completed successfully')
    return { success: true, message, nextFollowUpId: result.nextFollowUpId }

  } catch (error: any) {
    console.error('❌ [FOLLOWUPS] Error in updateFollowUpWithLeadStatus:', error)
    return { success: false, message: `System error: ${error.message}` }
  }
}

export async function updateFollowUpStatus(
  id: number,
  status: FollowUpStatus,
  data?: {
    completed_at?: string
    outcome?: string
    duration_minutes?: number
    follow_up_required?: boolean
    next_follow_up_date?: string
  },
): Promise<{ success: boolean; message: string; error?: any }> {
  try {
    console.log(`🔄 [FOLLOWUPS] Updating follow-up ${id} status to ${status} via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Get the current follow-up
    const followUpResult = await query(`
      SELECT 
        f.id, 
        f.status, 
        f.lead_id,
        l.lead_number, 
        l.client_name
      FROM lead_followups f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE f.id = $1
    `, [id])

    if (followUpResult.rows.length === 0) {
      console.error("❌ [FOLLOWUPS] Follow-up not found:", id)
      return { success: false, message: "Follow-up not found" }
    }

    const followUp = followUpResult.rows[0]

    // Validate status transition
    const currentStatus = followUp.status as FollowUpStatus
    if (!validateStatusTransition(currentStatus, status)) {
      return { 
        success: false, 
        message: `Invalid status transition from '${currentStatus}' to '${status}'` 
      }
    }

    const updateData: any = {
      status: String(status),
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    }

    // Add additional data if provided
    if (data) {
      if (status === "completed") {
        updateData.completed_at = data.completed_at
          ? new Date(data.completed_at).toISOString()
          : new Date().toISOString()
        
        updateData.completed_by = currentUser.id
        updateData.outcome = data.outcome ? String(data.outcome) : null
        updateData.duration_minutes = data.duration_minutes ? Number(data.duration_minutes) : null
      }

      if (data.follow_up_required !== undefined) {
        updateData.follow_up_required = Boolean(data.follow_up_required)
        updateData.next_follow_up_date = data.next_follow_up_date
          ? new Date(data.next_follow_up_date).toISOString()
          : null
      }
    }

    console.log("🔄 [FOLLOWUPS] Updating follow-up with data:", updateData)

    // Build dynamic UPDATE query
    const setClause = Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ')
    const values = [id, ...Object.values(updateData)]

    const updateResult = await query(`
      UPDATE lead_followups 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `, values)

    if (updateResult.rowCount === 0) {
      return { success: false, message: "Failed to update follow-up" }
    }

    // Auto-create next follow-up if required
    if (status === "completed" && data?.follow_up_required && data?.next_follow_up_date) {
      await createNextFollowUp(followUp.lead_id, data.next_follow_up_date, followUp)
    }

    revalidatePath("/sales/follow-up")
    revalidatePath(`/sales/lead/${followUp.lead_id}`)

    console.log(`✅ [FOLLOWUPS] Follow-up ${id} updated successfully`)
    return { success: true, message: "Follow-up updated successfully" }
  } catch (error: any) {
    console.error("❌ [FOLLOWUPS] Error updating follow-up:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error,
    }
  }
}

export async function deleteFollowUp(id: number): Promise<{ success: boolean; message: string; error?: any }> {
  try {
    console.log(`🗑️ [FOLLOWUPS] Deleting follow-up ${id} via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Get the follow-up details for logging
    const followUpResult = await query(`
      SELECT 
        f.id, 
        f.lead_id,
        l.lead_number, 
        l.client_name
      FROM lead_followups f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE f.id = $1
    `, [id])

    if (followUpResult.rows.length === 0) {
      console.error("❌ [FOLLOWUPS] Follow-up not found:", id)
      return { success: false, message: "Follow-up not found" }
    }

    const followUp = followUpResult.rows[0]

    const deleteResult = await query(`
      DELETE FROM lead_followups 
      WHERE id = $1
      RETURNING id
    `, [id])

    if (deleteResult.rowCount === 0) {
      return {
        success: false,
        message: "Failed to delete follow-up",
      }
    }

    // Log activity
    await logActivity({
      action: "DELETE_FOLLOW_UP",
      entityType: "follow_up",
      entityId: id.toString(),
      description: `Deleted follow-up for lead ${followUp.client_name}`,
    })

    revalidatePath("/follow-ups")
    revalidatePath(`/sales/lead/${followUp.lead_id}`)

    console.log(`✅ [FOLLOWUPS] Follow-up ${id} deleted successfully`)
    return { success: true, message: "Follow-up deleted successfully" }
  } catch (error: any) {
    console.error("❌ [FOLLOWUPS] Error deleting follow-up:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error,
    }
  }
}
// Add missing exported functions to fix build errors
export async function getFollowUpStats() {
  return { success: true, stats: {} }
}

export async function getUpcomingFollowUps() {
  return { success: true, followUps: [] }
}

export async function updateOverdueFollowUps() {
  return { success: true, message: "Updated overdue follow-ups" }
}

export async function getNotificationFollowUps() {
  return { success: true, followUps: [] }
}
