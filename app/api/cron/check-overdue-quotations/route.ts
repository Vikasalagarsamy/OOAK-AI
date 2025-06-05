import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/lib/notification-service'
import { differenceInDays } from 'date-fns'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you might want to add authentication)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Get all active quotations (not cancelled, rejected, or confirmed)
    const { data: quotations, error } = await supabase
      .from('quotations')
      .select('*')
      .not('workflow_status', 'in', '(cancelled,rejected,confirmed)')

    if (error) {
      console.error('Error fetching quotations:', error)
      return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 })
    }

    const overdueQuotations = []
    const now = new Date()

    // Define overdue thresholds for each stage
    const thresholds = {
      draft: 5,
      pending_client_confirmation: 3,
      pending_approval: 2,
      approved: 7, // 7 days to collect payment
      payment_received: 1 // 1 day to confirm delivery
    }

    for (const quotation of quotations || []) {
      const threshold = thresholds[quotation.workflow_status as keyof typeof thresholds]
      if (!threshold) continue

      // Calculate days in current stage
      let stageDate: Date
      switch (quotation.workflow_status) {
        case 'draft':
          stageDate = new Date(quotation.created_at)
          break
        case 'pending_client_confirmation':
          stageDate = quotation.client_verbal_confirmation_date 
            ? new Date(quotation.client_verbal_confirmation_date) 
            : new Date(quotation.created_at)
          break
        case 'pending_approval':
          // Get the submission date from approval table
          const { data: approval } = await supabase
            .from('quotation_approvals')
            .select('created_at')
            .eq('quotation_id', quotation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          stageDate = approval ? new Date(approval.created_at) : new Date(quotation.created_at)
          break
        case 'approved':
          // Get approval date
          const { data: approvalData } = await supabase
            .from('quotation_approvals')
            .select('approval_date')
            .eq('quotation_id', quotation.id)
            .eq('approval_status', 'approved')
            .single()
          stageDate = approvalData?.approval_date 
            ? new Date(approvalData.approval_date) 
            : new Date(quotation.created_at)
          break
        case 'payment_received':
          stageDate = quotation.payment_received_date 
            ? new Date(quotation.payment_received_date) 
            : new Date(quotation.created_at)
          break
        default:
          continue
      }

      const daysInStage = differenceInDays(now, stageDate)
      
      if (daysInStage >= threshold) {
        overdueQuotations.push({
          ...quotation,
          days_overdue: daysInStage,
          stage_date: stageDate.toISOString()
        })
      }
    }

    // Send notifications for overdue quotations
    let notificationsSent = 0
    for (const overdueQuotation of overdueQuotations) {
      try {
        await NotificationService.notifyOverdueQuotation(
          overdueQuotation, 
          overdueQuotation.days_overdue
        )
        notificationsSent++
      } catch (error) {
        console.error(`Failed to send notification for quotation ${overdueQuotation.id}:`, error)
      }
    }

    // Clean up expired notifications
    const cleanedUp = await NotificationService.cleanupExpiredNotifications()

    return NextResponse.json({
      success: true,
      checked: quotations?.length || 0,
      overdue_found: overdueQuotations.length,
      notifications_sent: notificationsSent,
      expired_notifications_cleaned: cleanedUp,
      overdue_quotations: overdueQuotations.map(q => ({
        id: q.id,
        client_name: q.client_name,
        status: q.workflow_status,
        days_overdue: q.days_overdue,
        value: q.total_amount
      }))
    })

  } catch (error) {
    console.error('Error in overdue quotations cron job:', error)
    return NextResponse.json(
      { error: 'Failed to process overdue quotations' },
      { status: 500 }
    )
  }
} 