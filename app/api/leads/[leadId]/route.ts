import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/lib/auth-utils'
import { logActivity } from '@/services/activity-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const leadId = parseInt(params.leadId)
    
    if (isNaN(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID' },
        { status: 400 }
      )
    }
    
    const { query, transaction } = createClient()
    
    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        id,
        lead_number,
        client_name,
        status,
        rejection_reason,
        rejected_at,
        rejected_by,
        updated_at,
        assigned_to
      `)
      .eq('id', leadId)
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch lead', details: error.message },
        { status: 500 }
      )
    }
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(lead)
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const leadId = parseInt(params.leadId)
    const body = await request.json()
    
    console.log(`🔄 PUT /api/leads/${leadId} - Updating lead status...`)
    console.log('📝 Request body:', body)
    
    if (isNaN(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID' },
        { status: 400 }
      )
    }
    
    const { query, transaction } = createClient()
    
    // Get current user for authorization and logging
    let currentUser
    try {
      currentUser = await getCurrentUser()
      console.log('👤 Current user:', currentUser?.username || 'Unknown')
    } catch (authError) {
      console.warn('⚠️ Could not get current user, proceeding with update...')
      // Continue without user context for now
    }
    
    // First, get the lead to check if it exists
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select(`
        id, 
        lead_number, 
        client_name, 
        assigned_to, 
        status, 
        company_id,
        branch_id
      `)
      .eq('id', leadId)
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching lead:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch lead details', details: fetchError.message },
        { status: 500 }
      )
    }
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    console.log(`📋 Found lead: ${lead.lead_number} (${lead.client_name})`)
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    
    // Add fields from request body
    if (body.status) {
      updateData.status = body.status
    }
    
    if (body.rejection_reason) {
      updateData.rejection_reason = body.rejection_reason
    }
    
    if (body.rejected_at) {
      updateData.rejected_at = body.rejected_at
    }
    
    if (body.rejected_by && currentUser?.id) {
      updateData.rejected_by = currentUser.id
    }
    
    console.log('📝 Update data:', updateData)
    
    // Update lead status
    const { error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
    
    if (updateError) {
      console.error('❌ Error updating lead status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead status', details: updateError.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Lead status updated successfully')
    
    // Log the activity if possible
    if (currentUser) {
      try {
        const activityDescription = body.status === 'REJECTED'
          ? `Lead rejected. Reason: ${body.rejection_reason || 'No reason provided'}`
          : `Lead status updated from ${lead.status} to ${body.status}`
        
        await logActivity({
          actionType: body.status === 'REJECTED' ? 'reject' : 'update',
          entityType: 'lead',
          entityId: leadId.toString(),
          entityName: lead.lead_number,
          description: activityDescription,
          userName: currentUser.username || 'Unknown User',
        })
        
        console.log('✅ Activity logged successfully')
      } catch (activityError) {
        console.warn('⚠️ Failed to log activity:', activityError)
        // Don't fail the request if activity logging fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Lead status updated successfully',
      lead: {
        id: leadId,
        status: body.status,
        updated_at: updateData.updated_at
      }
    })
    
  } catch (error: any) {
    console.error('❌ Exception in PUT /api/leads/[leadId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 