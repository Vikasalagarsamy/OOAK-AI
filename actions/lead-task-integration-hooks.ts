"use server"

import { LeadTaskIntegrationService, type LeadTaskTriggerEvent } from '@/services/lead-task-integration-service'
import type { LeadStatus } from '@/types/follow-up'

/**
 * Integration hooks for connecting existing lead actions with AI task system
 * These functions are called from existing lead actions WITHOUT modifying core functionality
 */

const integrationService = new LeadTaskIntegrationService()

/**
 * Hook: Called when a lead is assigned to an employee
 */
export async function triggerLeadAssignmentTasks(
  leadId: number,
  leadData: {
    id: number
    lead_number: string
    client_name: string
    status: LeadStatus
    estimated_value?: number
    assigned_to?: number
    company_id: number
    branch_id?: number
    created_at: string
    updated_at?: string
  },
  triggeredBy?: string
) {
  try {
    console.log(`🎯 Lead assignment hook triggered for lead ${leadId}`)
    
    const event: LeadTaskTriggerEvent = {
      eventType: 'lead_assigned',
      leadId,
      leadData,
      triggeredBy
    }

    const result = await integrationService.processLeadEvent(event)
    
    if (result.success && result.tasksGenerated > 0) {
      console.log(`✅ Lead assignment: Generated ${result.tasksGenerated} tasks for ${leadData.client_name}`)
      return {
        success: true,
        message: `Generated ${result.tasksGenerated} automated tasks for lead follow-up`,
        tasksGenerated: result.tasksGenerated,
        insights: result.businessInsights
      }
    } else {
      console.log(`ℹ️ Lead assignment: No tasks generated for ${leadData.client_name}`)
      return {
        success: true,
        message: 'Lead assigned successfully (no additional tasks needed)',
        tasksGenerated: 0,
        insights: []
      }
    }
  } catch (error: any) {
    console.error('❌ Lead assignment task generation failed:', error)
    return {
      success: false,
      message: 'Lead assigned but task automation failed',
      error: error?.message,
      tasksGenerated: 0,
      insights: []
    }
  }
}

/**
 * Hook: Called when lead status changes
 */
export async function triggerLeadStatusChangeTasks(
  leadId: number,
  leadData: {
    id: number
    lead_number: string
    client_name: string
    status: LeadStatus
    estimated_value?: number
    assigned_to?: number
    company_id: number
    branch_id?: number
    created_at: string
    updated_at?: string
  },
  previousStatus: LeadStatus,
  triggeredBy?: string
) {
  try {
    console.log(`🎯 Lead status change hook triggered: ${previousStatus} → ${leadData.status} for lead ${leadId}`)
    
    const event: LeadTaskTriggerEvent = {
      eventType: 'lead_status_changed',
      leadId,
      leadData,
      previousStatus,
      triggeredBy
    }

    const result = await integrationService.processLeadEvent(event)
    
    if (result.success && result.tasksGenerated > 0) {
      console.log(`✅ Status change: Generated ${result.tasksGenerated} tasks for ${leadData.client_name}`)
      return {
        success: true,
        message: `Status updated and ${result.tasksGenerated} automated tasks created`,
        tasksGenerated: result.tasksGenerated,
        insights: result.businessInsights
      }
    } else {
      console.log(`ℹ️ Status change: No tasks generated for ${leadData.client_name}`)
      return {
        success: true,
        message: 'Lead status updated successfully',
        tasksGenerated: 0,
        insights: []
      }
    }
  } catch (error: any) {
    console.error('❌ Lead status change task generation failed:', error)
    return {
      success: false,
      message: 'Lead status updated but task automation failed',
      error: error?.message,
      tasksGenerated: 0,
      insights: []
    }
  }
}

/**
 * Hook: Called when a quotation is created for a lead
 */
export async function triggerQuotationCreatedTasks(
  leadId: number,
  leadData: {
    id: number
    lead_number: string
    client_name: string
    status: LeadStatus
    estimated_value?: number
    assigned_to?: number
    company_id: number
    branch_id?: number
    created_at: string
    updated_at?: string
  },
  quotationData: {
    id: number
    quotation_number: string
    total_amount: number
    status: string
    created_at: string
  },
  triggeredBy?: string
) {
  try {
    console.log(`🎯 Quotation created hook triggered for lead ${leadId}, quotation ${quotationData.id}`)
    
    const event: LeadTaskTriggerEvent = {
      eventType: 'quotation_created',
      leadId,
      leadData,
      quotationData,
      triggeredBy
    }

    const result = await integrationService.processLeadEvent(event)
    
    if (result.success && result.tasksGenerated > 0) {
      console.log(`✅ Quotation created: Generated ${result.tasksGenerated} tasks for ${leadData.client_name}`)
      return {
        success: true,
        message: `Quotation created and ${result.tasksGenerated} follow-up tasks automated`,
        tasksGenerated: result.tasksGenerated,
        insights: result.businessInsights
      }
    } else {
      console.log(`ℹ️ Quotation created: No tasks generated for ${leadData.client_name}`)
      return {
        success: true,
        message: 'Quotation created successfully',
        tasksGenerated: 0,
        insights: []
      }
    }
  } catch (error: any) {
    console.error('❌ Quotation created task generation failed:', error)
    return {
      success: false,
      message: 'Quotation created but task automation failed',
      error: error?.message,
      tasksGenerated: 0,
      insights: []
    }
  }
}

/**
 * Hook: Called when a quotation is sent to client
 */
export async function triggerQuotationSentTasks(
  leadId: number,
  leadData: {
    id: number
    lead_number: string
    client_name: string
    status: LeadStatus
    estimated_value?: number
    assigned_to?: number
    company_id: number
    branch_id?: number
    created_at: string
    updated_at?: string
  },
  quotationData: {
    id: number
    quotation_number: string
    total_amount: number
    status: string
    created_at: string
  },
  triggeredBy?: string
) {
  try {
    console.log(`🎯 Quotation sent hook triggered for lead ${leadId}, quotation ${quotationData.id}`)
    
    const event: LeadTaskTriggerEvent = {
      eventType: 'quotation_sent',
      leadId,
      leadData,
      quotationData,
      triggeredBy
    }

    const result = await integrationService.processLeadEvent(event)
    
    if (result.success && result.tasksGenerated > 0) {
      console.log(`✅ Quotation sent: Generated ${result.tasksGenerated} follow-up tasks for ${leadData.client_name}`)
      return {
        success: true,
        message: `Quotation sent and ${result.tasksGenerated} follow-up tasks scheduled`,
        tasksGenerated: result.tasksGenerated,
        insights: result.businessInsights
      }
    } else {
      console.log(`ℹ️ Quotation sent: No tasks generated for ${leadData.client_name}`)
      return {
        success: true,
        message: 'Quotation sent successfully',
        tasksGenerated: 0,
        insights: []
      }
    }
  } catch (error: any) {
    console.error('❌ Quotation sent task generation failed:', error)
    return {
      success: false,
      message: 'Quotation sent but follow-up automation failed',
      error: error?.message,
      tasksGenerated: 0,
      insights: []
    }
  }
}

/**
 * Hook: Called when a quotation is approved
 */
export async function triggerQuotationApprovedTasks(
  leadId: number,
  leadData: {
    id: number
    lead_number: string
    client_name: string
    status: LeadStatus
    estimated_value?: number
    assigned_to?: number
    company_id: number
    branch_id?: number
    created_at: string
    updated_at?: string
  },
  quotationData: {
    id: number
    quotation_number: string
    total_amount: number
    status: string
    created_at: string
  },
  triggeredBy?: string
) {
  try {
    console.log(`🎯 Quotation approved hook triggered for lead ${leadId}, quotation ${quotationData.id}`)
    
    const event: LeadTaskTriggerEvent = {
      eventType: 'quotation_approved',
      leadId,
      leadData,
      quotationData,
      triggeredBy
    }

    const result = await integrationService.processLeadEvent(event)
    
    if (result.success && result.tasksGenerated > 0) {
      console.log(`✅ Quotation approved: Generated ${result.tasksGenerated} payment tasks for ${leadData.client_name}`)
      return {
        success: true,
        message: `Quotation approved and ${result.tasksGenerated} payment follow-up tasks created`,
        tasksGenerated: result.tasksGenerated,
        insights: result.businessInsights
      }
    } else {
      console.log(`ℹ️ Quotation approved: No tasks generated for ${leadData.client_name}`)
      return {
        success: true,
        message: 'Quotation approved successfully',
        tasksGenerated: 0,
        insights: []
      }
    }
  } catch (error: any) {
    console.error('❌ Quotation approved task generation failed:', error)
    return {
      success: false,
      message: 'Quotation approved but payment follow-up automation failed',
      error: error?.message,
      tasksGenerated: 0,
      insights: []
    }
  }
}

/**
 * Utility: Get lead task analytics for dashboard display
 */
export async function getLeadTaskAnalytics(leadId: number) {
  try {
    return await integrationService.getLeadTaskAnalytics(leadId)
  } catch (error: any) {
    console.error('❌ Error fetching lead task analytics:', error)
    return null
  }
}

/**
 * Utility: Get task generation summary for dashboard
 */
export async function getTaskGenerationSummary() {
  try {
    return await integrationService.getTaskGenerationSummary()
  } catch (error: any) {
    console.error('❌ Error fetching task generation summary:', error)
    return 'Unable to fetch task generation summary'
  }
}

/**
 * Utility: Manual trigger for lead task generation (for testing/manual intervention)
 */
export async function manualTriggerLeadTasks(
  leadId: number,
  eventType: 'lead_assigned' | 'lead_status_changed' | 'quotation_created' | 'quotation_sent' | 'quotation_approved',
  reason?: string
) {
  try {
    console.log(`🔧 Manual trigger for lead ${leadId}, event: ${eventType}`)
    
    // This would require fetching lead data from database
    // For now, return a placeholder response
    return {
      success: true,
      message: `Manual trigger initiated for ${eventType}`,
      tasksGenerated: 0,
      insights: ['Manual trigger feature - implementation pending']
    }
  } catch (error: any) {
    console.error('❌ Manual trigger failed:', error)
    return {
      success: false,
      message: 'Manual trigger failed',
      error: error?.message,
      tasksGenerated: 0,
      insights: []
    }
  }
} 