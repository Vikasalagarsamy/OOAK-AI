import { NextRequest, NextResponse } from 'next/server'
import { RealtimeSyncService } from '@/lib/realtime-sync-service'
import { ActivityTrackingService } from '@/lib/activity-tracking-service'
import { BusinessNotificationService } from '@/lib/business-notification-service'
import { createClient } from '@/lib/postgresql-client'

// 🔗 Webhook for Quotation Updates
// This endpoint gets triggered when quotations are created/updated
export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Webhook triggered: Quotation updated')
    
    const payload = await request.json()
    console.log('📝 Webhook payload:', payload)

    // Get the quotation details from the payload
    const { type, table, record, old_record } = payload
    
    if (table !== 'quotations') {
      return NextResponse.json({ message: 'Not a quotation update' })
    }

    // Handle different webhook events
    switch (type) {
      case 'INSERT':
        await handleQuotationCreated(record)
        break
      case 'UPDATE':
        await handleQuotationUpdated(record, old_record)
        break
      case 'DELETE':
        await handleQuotationDeleted(old_record)
        break
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Webhook processing failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 📝 Handle new quotation creation
async function handleQuotationCreated(quotation: any) {
  console.log('📝 New quotation created:', quotation.id)
  
  // Track quotation creation activity
  await ActivityTrackingService.logQuotationCreated(quotation, quotation.created_by)

  // Trigger real-time sync to update performance metrics
  await RealtimeSyncService.syncQuotationData()
  
  // 🔔 Send smart business notifications
  await BusinessNotificationService.notifyQuotationCreated(quotation, quotation.created_by)
}

// 📊 Handle quotation status updates
async function handleQuotationUpdated(quotation: any, oldQuotation: any) {
  console.log('📊 Quotation updated:', quotation.id, 'Status:', quotation.status)
  
  // Check if status changed
  if (quotation.status !== oldQuotation.status) {
    // Handle the status change
    await ActivityTrackingService.handleQuotationStatusChange(
      quotation.id, 
      oldQuotation.status, 
      quotation.status, 
      quotation.created_by
    )

    // Handle specific status changes with business notifications
    if (quotation.status === 'approved' && oldQuotation.status !== 'approved') {
      await ActivityTrackingService.logDealWon(quotation.id, quotation.total_amount, quotation.created_by)
      
      // 🔔 Send approval notifications
      await BusinessNotificationService.notifyQuotationApproved(quotation, 'system')
    }
  }

  // Check workflow status changes
  if (quotation.workflow_status !== oldQuotation.workflow_status) {
    await handleWorkflowStatusChange(quotation, oldQuotation)
  }

  // Trigger real-time sync to update performance metrics
  await RealtimeSyncService.syncQuotationData()
}

// 🔄 Handle workflow status changes
async function handleWorkflowStatusChange(quotation: any, oldQuotation: any) {
  console.log(`🔄 Workflow status changed: ${oldQuotation.workflow_status} → ${quotation.workflow_status}`)
  
  switch (quotation.workflow_status) {
    case 'pending_approval':
      await BusinessNotificationService.notifyQuotationSubmittedForApproval(quotation, quotation.created_by)
      break
      
    case 'approved':
      await BusinessNotificationService.notifyQuotationApproved(quotation, 'system')
      break
      
    case 'payment_received':
      if (quotation.payment_amount) {
        await BusinessNotificationService.notifyPaymentReceived(
          quotation, 
          quotation.payment_amount, 
          'system'
        )
      }
      break
  }
}

// 🗑️ Handle quotation deletion
async function handleQuotationDeleted(quotation: any) {
  console.log('🗑️ Quotation deleted:', quotation.id)
  
  // For deleted quotations, we'll log this as a deal lost
  await ActivityTrackingService.logDealLost(quotation.id, 'Quotation deleted', quotation.created_by)

  // Trigger sync to recalculate metrics
  await RealtimeSyncService.syncQuotationData()
} 