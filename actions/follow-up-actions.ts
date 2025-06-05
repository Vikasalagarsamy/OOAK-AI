"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { FollowUpStatus, FollowUpWithLead, FollowUpFilters, FollowUp, FollowUpFormData, FollowUpCompletionData, LeadStatus } from "@/types/follow-up"
import { VALID_STATUS_TRANSITIONS, SUGGESTED_LEAD_STATUS_BY_OUTCOME } from "@/types/follow-up"
import { getCurrentUser } from "@/lib/auth-utils"
import { logActivity } from "@/services/activity-service"
import { VALID_FOLLOWUP_TYPES, FollowUpSchema, type FollowupType } from "@/lib/follow-up-constants"
import { validateStatusTransition, getDateRanges, getSuggestedLeadStatuses } from "@/lib/follow-up-utils"
import { updateLeadStatus } from "@/actions/lead-actions"
import { getQuotationByLeadId, updateQuotationStatus } from "./quotations-actions"

export async function getFollowUps(filters?: FollowUpFilters): Promise<FollowUpWithLead[]> {
  const supabase = createClient()

  try {
    let query = supabase.from("lead_followups").select(`
      *,
      lead:leads(lead_number, client_name, status)
    `)

    const dateRanges = getDateRanges()

    // Apply smart filters first
    if (filters?.smart) {
      if (filters.smart.overdue) {
        // Past scheduled follow-ups that aren't completed, cancelled, or missed
        query = query
          .lt("scheduled_at", dateRanges.now)
          .in("status", ["scheduled", "in_progress"])
      }
      
      if (filters.smart.today) {
        // Follow-ups scheduled for today
        query = query
          .gte("scheduled_at", dateRanges.today)
          .lt("scheduled_at", dateRanges.tomorrow)
          .in("status", ["scheduled", "in_progress"])
      }
      
      if (filters.smart.thisWeek) {
        // Follow-ups scheduled for this week
        query = query
          .gte("scheduled_at", dateRanges.startOfWeek)
          .lte("scheduled_at", dateRanges.endOfWeek)
          .in("status", ["scheduled", "in_progress"])
      }
      
      if (filters.smart.upcoming) {
        // Future + current follow-ups that aren't done
        query = query
          .gte("scheduled_at", dateRanges.now)
          .in("status", ["scheduled", "in_progress", "rescheduled"])
      }
    }

    // Apply regular filters
    if (filters) {
      if (filters.status && !filters.smart) {
        if (Array.isArray(filters.status)) {
          query = query.in("status", filters.status)
        } else {
          query = query.eq("status", filters.status)
        }
      }

      if (filters.leadId) {
        query = query.eq("lead_id", filters.leadId)
      }

      if (filters.startDate && !filters.smart?.today && !filters.smart?.thisWeek) {
        query = query.gte("scheduled_at", filters.startDate)
      }

      if (filters.endDate && !filters.smart?.today && !filters.smart?.thisWeek) {
        query = query.lte("scheduled_at", filters.endDate)
      }

      if (filters.priority) {
        query = query.eq("priority", filters.priority)
      }
    }

    // Order by scheduled date
    query = query.order("scheduled_at", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching follow-ups:", error)
      throw new Error(`Failed to fetch follow-ups: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getFollowUps:", error)
    return []
  }
}

export async function getFollowUpById(id: number): Promise<FollowUpWithLead | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("lead_followups")
      .select(`
        *,
        lead:leads(lead_number, client_name, status)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching follow-up:", error)
      return null
    }

    return data as FollowUpWithLead
  } catch (error) {
    console.error("Error in getFollowUpById:", error)
    return null
  }
}

export async function createFollowUp(
  formData: FollowUpFormData,
): Promise<{ success: boolean; message: string; id?: number; error?: any }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Validate the lead exists and check status
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name, status")
      .eq("id", formData.lead_id)
      .single()

    if (leadError || !lead) {
      console.error("Error validating lead:", leadError)
      return { success: false, message: "Invalid lead ID" }
    }

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

    // Prepare the data based on the column name
    const followUpData: Record<string, any> = {
      lead_id: Number(formData.lead_id),
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      notes: formData.notes ? String(formData.notes) : null,
      priority: String(formData.priority),
      interaction_summary: formData.interaction_summary ? String(formData.interaction_summary) : null,
      status: "scheduled",
      created_by: currentUser.id ? String(currentUser.id) : null,
      created_at: new Date().toISOString(),
      follow_up_required: false,
      next_follow_up_date: null,
    }

    // Set the appropriate column based on what exists in the database
    if (hasContactMethod) {
      followUpData.contact_method = String(formData.followup_type)
    }
    if (hasFollowupType) {
      followUpData.followup_type = String(formData.followup_type)
    }

    // If neither column exists, add a clear error message
    if (!hasContactMethod && !hasFollowupType) {
      return {
        success: false,
        message:
          "Database schema error: Neither contact_method nor followup_type columns exist in the lead_followups table.",
      }
    }

    console.log("Inserting follow-up data:", followUpData)

    // Insert the data
    const { data, error } = await supabase.from("lead_followups").insert(followUpData).select()

    if (error) {
      console.error("Error creating follow-up:", error)
      return {
        success: false,
        message: `Failed to create follow-up: ${error.message}`,
        error: error,
      }
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: "Follow-up was created but no data was returned.",
      }
    }

    // Log activity
    try {
      await logActivity({
        actionType: "create",
        entityType: "follow_up",
        entityId: data[0].id.toString(),
        entityName: `Follow-up for Lead ${lead.lead_number}`,
        description: `Scheduled a ${formData.followup_type} follow-up for ${new Date(formData.scheduled_at).toLocaleString()}`,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
      })
    } catch (logError) {
      console.error("Error logging activity:", logError)
      // Continue execution even if logging fails
    }

    revalidatePath("/follow-ups")
    revalidatePath(`/leads/${formData.lead_id}`)

    return {
      success: true,
      message: "Follow-up scheduled successfully",
      id: data[0].id,
    }
  } catch (error) {
    console.error("Error creating follow-up:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error,
    }
  }
}

// Helper function to check if a column exists in a table
async function checkIfColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Use information_schema to check if column exists
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", tableName)
      .eq("column_name", columnName)

    if (error) {
      console.error(`Error checking if column ${columnName} exists:`, error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error(`Error in checkIfColumnExists for ${columnName}:`, error)
    return false
  }
}

export async function scheduleLeadFollowup(data: {
  leadId: number
  scheduledAt: string
  followupType: string
  notes?: string
  priority: string
  summary?: string
}) {
  const supabase = createClient()

  try {
    console.log("Scheduling follow-up with data:", data)

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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, message: "Authentication required" }
    }

    // Verify the lead exists and check status
    const { data: leadExists, error: leadCheckError } = await supabase
      .from("leads")
      .select("id, status")
      .eq("id", data.leadId)
      .single()

    if (leadCheckError || !leadExists) {
      console.error("Lead does not exist:", leadCheckError)
      return { success: false, message: "The specified lead does not exist" }
    }

    // Prevent creating follow-ups for closed deals
    if (leadExists.status === "WON") {
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
    const followUpData: Record<string, any> = {
      lead_id: data.leadId,
      scheduled_at: data.scheduledAt,
      notes: data.notes || "",
      priority: data.priority,
      interaction_summary: data.summary || "",
      status: "scheduled",
      created_at: new Date().toISOString(),
    }

    // Only set created_by if the user ID looks like a UUID (not an integer)
    if (user.id && typeof user.id === 'string' && user.id.includes('-')) {
      followUpData.created_by = String(user.id)
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
        message:
          "Database schema error: Neither contact_method nor followup_type columns exist in the lead_followups table.",
      }
    }

    // Insert the follow-up
    const { data: followup, error } = await supabase.from("lead_followups").insert(followUpData).select()

    if (error) {
      console.error("Error inserting follow-up:", error)

      // Check for specific error types
      if (error.code === "23505") {
        return { success: false, message: "A follow-up with these details already exists" }
      } else if (error.code === "23503") {
        return { success: false, message: "Referenced lead or user does not exist" }
      } else if (error.code === "42703") {
        return { success: false, message: "Database column error. Please contact support." }
      }

      return { success: false, message: `Failed to schedule follow-up: ${error.message}` }
    }

    if (!followup || followup.length === 0) {
      return {
        success: false,
        message: "Follow-up was created but no data was returned.",
      }
    }

    console.log("Follow-up scheduled successfully:", followup)

    // Revalidate relevant paths to update UI
    revalidatePath(`/sales/lead/${data.leadId}`)
    revalidatePath("/sales/my-leads")
    revalidatePath("/follow-ups")

    return {
      success: true,
      message: "Follow-up scheduled successfully",
      data: followup[0], // Return the first followup object instead of the array
    }
  } catch (error: any) {
    console.error("Unexpected error in scheduleLeadFollowup:", error)
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

    console.log(`Lead ${leadId} marked as ${leadStatus}, checking for quotation to update...`)
    
    const quotationResult = await getQuotationByLeadId(leadId.toString())
    if (!quotationResult.success || !quotationResult.quotation) {
      console.log(`No quotation found for lead ${leadId}`)
      return { success: true, message: 'No quotation found to sync' }
    }

    // Skip if quotation is already rejected
    if (quotationResult.quotation.status === 'rejected') {
      console.log(`Quotation ${quotationResult.quotation.quotation_number} already rejected`)
      return { success: true, message: 'Quotation already in rejected status' }
    }

    console.log(`Found quotation ${quotationResult.quotation.quotation_number}, updating status to rejected...`)
    
    const quotationUpdateResult = await updateQuotationStatus(
      quotationResult.quotation.id.toString(), 
      'rejected'
    )
    
    if (quotationUpdateResult.success) {
      console.log(`✅ Quotation ${quotationResult.quotation.quotation_number} automatically marked as rejected`)
      return { 
        success: true, 
        message: `Quotation ${quotationResult.quotation.quotation_number} automatically moved to rejected status` 
      }
    } else {
      console.error(`❌ Failed to update quotation status:`, quotationUpdateResult.error)
      return { 
        success: false, 
        message: `Failed to sync quotation status: ${quotationUpdateResult.error}` 
      }
    }
    
  } catch (error: any) {
    console.error('Error syncing quotation status:', error)
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
  const supabase = createClient()

  try {
    console.log(`Updating follow-up ${followUpId} with status ${status} and updates:`, updates)

    // Get the current follow-up to access lead information
    const { data: currentFollowUp, error: fetchError } = await supabase
      .from('lead_followups')
      .select(`
        *,
        leads (
          id,
          lead_number,
          client_name,
          status
        )
      `)
      .eq('id', followUpId)
      .single()

    if (fetchError || !currentFollowUp) {
      console.error('Error fetching follow-up:', fetchError)
      return { success: false, message: `Failed to fetch follow-up: ${fetchError?.message}` }
    }

    // Start a transaction by updating follow-up first
    const { error: followUpError } = await supabase
      .from('lead_followups')
      .update({
        status,
        completed_at: updates.completed_at,
        outcome: updates.outcome,
        duration_minutes: updates.duration_minutes,
        follow_up_required: updates.follow_up_required,
        next_follow_up_date: updates.next_follow_up_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', followUpId)

    if (followUpError) {
      console.error('Error updating follow-up:', followUpError)
      return { success: false, message: `Failed to update follow-up: ${followUpError.message}` }
    }

    let nextFollowUpId: number | undefined

    // Update lead status if provided
    if (updates.lead_status && currentFollowUp.leads?.id) {
      console.log(`Updating lead ${currentFollowUp.leads.id} status to ${updates.lead_status}`)
      
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: updates.lead_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentFollowUp.leads.id)

      if (leadError) {
        console.error('Error updating lead status:', leadError)
        return { success: false, message: `Failed to update lead status: ${leadError.message}` }
      }

      // 🎯 AUTOMATIC QUOTATION STATUS SYNC
      // If lead is marked as REJECTED or LOST, update associated quotation
      if (['REJECTED', 'LOST'].includes(updates.lead_status)) {
        console.log(`Lead marked as ${updates.lead_status}, checking for quotation to update...`)
        
        const quotationResult = await getQuotationByLeadId(currentFollowUp.leads.id.toString())
        if (quotationResult.success && quotationResult.quotation) {
          console.log(`Found quotation ${quotationResult.quotation.quotation_number}, updating status to rejected...`)
          
          const quotationUpdateResult = await updateQuotationStatus(
            quotationResult.quotation.id.toString(), 
            'rejected'
          )
          
          if (quotationUpdateResult.success) {
            console.log(`✅ Quotation ${quotationResult.quotation.quotation_number} automatically marked as rejected`)
          } else {
            console.error(`❌ Failed to update quotation status:`, quotationUpdateResult.error)
            // Don't fail the entire operation, just log the error
          }
        } else {
          console.log(`No quotation found for lead ${currentFollowUp.leads.id}`)
        }
      }
    }

    // Create next follow-up if required
    if (updates.follow_up_required && updates.next_follow_up_date && currentFollowUp.leads?.id) {
      console.log('Creating next follow-up...')
      
      const nextFollowUpDate = new Date(updates.next_follow_up_date)
      
      const { data: nextFollowUp, error: nextFollowUpError } = await supabase
        .from('lead_followups')
        .insert({
          lead_id: currentFollowUp.leads.id,
          scheduled_at: nextFollowUpDate.toISOString(),
          status: 'scheduled' as FollowUpStatus,
          priority: 'medium',
          contact_method: currentFollowUp.contact_method || 'phone',
          followup_type: currentFollowUp.followup_type || 'phone',
          notes: `Follow-up scheduled from completed follow-up #${followUpId}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (nextFollowUpError) {
        console.error('Error creating next follow-up:', nextFollowUpError)
        return { success: false, message: `Follow-up updated but failed to create next follow-up: ${nextFollowUpError.message}` }
      }

      nextFollowUpId = nextFollowUp.id
      console.log(`Next follow-up created with ID: ${nextFollowUpId}`)
    }

    // Revalidate relevant pages
    revalidatePath('/sales/follow-up')
    revalidatePath('/sales/leads')
    revalidatePath('/sales/quotations') // Revalidate quotations page for status changes

    let message = `Follow-up marked as ${status}`
    if (updates.lead_status) {
      message += ` and lead status updated to ${updates.lead_status}`
    }
    if (nextFollowUpId) {
      message += `. Next follow-up scheduled.`
    }
    if (['REJECTED', 'LOST'].includes(updates.lead_status || '')) {
      message += ` Associated quotation has been automatically moved to rejected status.`
    }

    console.log('Follow-up update completed successfully')
    return { success: true, message, nextFollowUpId }

  } catch (error: any) {
    console.error('Error in updateFollowUpWithLeadStatus:', error)
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
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Get the current follow-up
    const { data: followUp, error: fetchError } = await supabase
      .from("lead_followups")
      .select(`
        id, 
        status, 
        lead_id,
        lead:leads(lead_number, client_name)
      `)
      .eq("id", id)
      .single()

    if (fetchError || !followUp) {
      console.error("Error fetching follow-up:", fetchError)
      return { success: false, message: "Follow-up not found", error: fetchError }
    }

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
    }

    // Only set updated_by if the user ID looks like a UUID (not an integer)
    if (currentUser.id && typeof currentUser.id === 'string' && currentUser.id.includes('-')) {
      updateData.updated_by = String(currentUser.id)
    }

    // Add additional data if provided
    if (data) {
      if (status === "completed") {
        updateData.completed_at = data.completed_at
          ? new Date(data.completed_at).toISOString()
          : new Date().toISOString()
        
        // Only set completed_by if the user ID looks like a UUID (not an integer)
        if (currentUser.id && typeof currentUser.id === 'string' && currentUser.id.includes('-')) {
          updateData.completed_by = String(currentUser.id)
        }
        
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

    console.log("Updating follow-up with data:", updateData)

    const { error: updateError } = await supabase.from("lead_followups").update(updateData).eq("id", id)

    if (updateError) {
      console.error("Error updating follow-up:", updateError)
      return {
        success: false,
        message: `Failed to update follow-up: ${updateError.message}`,
        error: updateError,
      }
    }

    // Auto-create next follow-up if required
    if (status === "completed" && data?.follow_up_required && data?.next_follow_up_date) {
      await createNextFollowUp(followUp.lead_id, data.next_follow_up_date, followUp)
    }

    revalidatePath("/sales/follow-up")
    revalidatePath(`/sales/lead/${followUp.lead_id}`)

    return { success: true, message: "Follow-up updated successfully" }
  } catch (error) {
    console.error("Error updating follow-up:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error,
    }
  }
}

export async function deleteFollowUp(id: number): Promise<{ success: boolean; message: string; error?: any }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Get the follow-up details for logging
    const { data: followUp, error: fetchError } = await supabase
      .from("lead_followups")
      .select(`
        id, 
        lead_id,
        lead:leads(lead_number, client_name)
      `)
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching follow-up:", fetchError)
      return { success: false, message: "Follow-up not found", error: fetchError }
    }

    const { error: deleteError } = await supabase.from("lead_followups").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting follow-up:", deleteError)
      return {
        success: false,
        message: `Failed to delete follow-up: ${deleteError.message}`,
        error: deleteError,
      }
    }

    // Log activity
    await logActivity({
      actionType: "delete",
      entityType: "follow_up",
      entityId: id.toString(),
      entityName: `Follow-up for Lead ${followUp.lead.lead_number}`,
      description: `Deleted follow-up for lead ${followUp.lead.client_name}`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath("/follow-ups")
    revalidatePath(`/leads/${followUp.lead_id}`)

    return { success: true, message: "Follow-up deleted successfully" }
  } catch (error) {
    console.error("Error deleting follow-up:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error,
    }
  }
}

export async function getUpcomingFollowUps(days = 7): Promise<FollowUpWithLead[]> {
  const supabase = createClient()

  const startDate = new Date().toISOString()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  const { data, error } = await supabase
    .from("lead_followups")
    .select(`
      *,
      lead:leads(lead_number, client_name)
    `)
    .eq("status", "scheduled")
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate.toISOString())
    .order("scheduled_at", { ascending: true })

  if (error) {
    console.error("Error fetching upcoming follow-ups:", error)
    throw new Error("Failed to fetch upcoming follow-ups")
  }

  return data as FollowUpWithLead[]
}

export async function getFollowUpStats(): Promise<{
  total: number
  completed: number
  scheduled: number
  missed: number
  cancelled: number
  byMethod: Record<string, number>
}> {
  const supabase = createClient()

  // Get counts by status
  const { data: statusCounts, error: statusError } = await supabase
    .from("lead_followups")
    .select("status, count", { count: "exact" })
    .group("status")

  if (statusError) {
    console.error("Error fetching follow-up stats:", statusError)
    throw new Error("Failed to fetch follow-up statistics")
  }

  // Get counts by followup type
  const { data: methodCounts, error: methodError } = await supabase
    .from("lead_followups")
    .select("followup_type, count", { count: "exact" })
    .group("followup_type")

  if (methodError) {
    console.error("Error fetching follow-up method stats:", methodError)
    throw new Error("Failed to fetch follow-up method statistics")
  }

  // Calculate total
  const { count: total, error: totalError } = await supabase
    .from("lead_followups")
    .select("*", { count: "exact", head: true })

  if (totalError) {
    console.error("Error fetching total follow-ups:", totalError)
    throw new Error("Failed to fetch total follow-ups")
  }

  // Process the results
  const stats = {
    total: total || 0,
    completed: 0,
    scheduled: 0,
    missed: 0,
    cancelled: 0,
    byMethod: {} as Record<string, number>,
  }

  statusCounts?.forEach((item) => {
    const status = item.status as FollowUpStatus
    const count = Number.parseInt(item.count as unknown as string)
    stats[status] = count
  })

  methodCounts?.forEach((item) => {
    const method = item.followup_type
    const count = Number.parseInt(item.count as unknown as string)
    stats.byMethod[method] = count
  })

  return stats
}

// Add a diagnostic function to help troubleshoot follow-up creation issues
export async function testFollowUpCreation(leadId: number, followupType = "phone") {
  const supabase = createClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Create minimal test data
    const testData = {
      lead_id: Number(leadId),
      scheduled_at: new Date().toISOString(),
      followup_type: followupType,
      status: "scheduled",
      priority: "medium",
      created_by: user?.id ? String(user.id) : null,
    }

    console.log("Testing follow-up creation with data:", testData)

    const { data, error } = await supabase.from("lead_followups").insert(testData).select()

    if (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        error: error,
      }
    }

    return {
      success: true,
      message: "Test follow-up creation succeeded",
      data: data,
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Unexpected error during test",
      error: error.message || String(error),
    }
  }
}

// Helper function to auto-create next follow-up
async function createNextFollowUp(leadId: number, nextDate: string, previousFollowUp: any) {
  const supabase = createClient()
  
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return
    
    // Check lead status before creating next follow-up
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("status")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      console.error("Error checking lead status for next follow-up:", leadError)
      return
    }

    // Don't create follow-ups for closed deals
    if (lead.status === "WON") {
      console.log(`Skipping auto-follow-up creation for lead ${leadId} - deal is won`)
      return
    }
    
    const nextFollowUpData = {
      lead_id: leadId,
      contact_method: previousFollowUp.contact_method || 'phone',
      scheduled_at: new Date(nextDate).toISOString(),
      status: 'scheduled' as FollowUpStatus,
      priority: previousFollowUp.priority || 'medium',
      notes: `Auto-created follow-up from previous interaction`,
      follow_up_required: false,
      created_at: new Date().toISOString(),
    }

    // Only set created_by if the user ID looks like a UUID
    if (currentUser.id && typeof currentUser.id === 'string' && currentUser.id.includes('-')) {
      nextFollowUpData.created_by = String(currentUser.id)
    }

    const { error } = await supabase
      .from("lead_followups")
      .insert(nextFollowUpData)

    if (error) {
      console.error("Error creating next follow-up:", error)
    }
  } catch (error) {
    console.error("Error in createNextFollowUp:", error)
  }
}

// Automated status updates (for background jobs)
export async function updateOverdueFollowUps(): Promise<{ updated: number; errors: string[] }> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const errors: string[] = []
  let updated = 0

  try {
    // Get all overdue follow-ups that are still scheduled or in_progress
    const { data: overdueFollowUps, error: fetchError } = await supabase
      .from("lead_followups")
      .select("id, status, scheduled_at")
      .lt("scheduled_at", now)
      .in("status", ["scheduled", "in_progress"])

    if (fetchError) {
      errors.push(`Failed to fetch overdue follow-ups: ${fetchError.message}`)
      return { updated: 0, errors }
    }

    if (!overdueFollowUps || overdueFollowUps.length === 0) {
      return { updated: 0, errors: [] }
    }

    // Update each overdue follow-up to "missed"
    for (const followUp of overdueFollowUps) {
      if (validateStatusTransition(followUp.status as FollowUpStatus, "missed")) {
        const { error: updateError } = await supabase
          .from("lead_followups")
          .update({
            status: "missed",
            updated_at: now
          })
          .eq("id", followUp.id)

        if (updateError) {
          errors.push(`Failed to update follow-up ${followUp.id}: ${updateError.message}`)
        } else {
          updated++
        }
      }
    }

    return { updated, errors }
  } catch (error) {
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    return { updated, errors }
  }
}

// Get upcoming follow-ups for notifications
export async function getNotificationFollowUps(hoursAhead: number = 24): Promise<FollowUpWithLead[]> {
  const now = new Date()
  const future = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000))

  return getFollowUps({
    smart: { upcoming: true },
    startDate: now.toISOString(),
    endDate: future.toISOString(),
    status: ["scheduled", "in_progress"]
  })
}
