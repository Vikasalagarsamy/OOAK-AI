import { createClient } from '@/lib/supabase/server'
import type { 
  Notification, 
  NotificationType, 
  NotificationPriority
} from '@/types/notifications'

interface CreateNotificationParams {
  user_id: number
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  quotation_id?: number
  action_url?: string
  action_label?: string
  expires_at?: string
  metadata?: Record<string, any>
}

export class NotificationService {
  
  static async createNotification(params: CreateNotificationParams): Promise<string | null> {
    try {
      console.log('🔍 NotificationService - Creating notification with params:', params)
      
      const supabase = createClient()
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      console.log('🔍 NotificationService - Generated ID:', notificationId)

      const insertData = {
        id: notificationId,
        user_id: params.user_id,
        type: params.type,
        priority: params.priority || 'medium',
        title: params.title,
        message: params.message,
        quotation_id: params.quotation_id,
        is_read: false,
        created_at: new Date().toISOString(),
        expires_at: params.expires_at,
        action_url: params.action_url,
        action_label: params.action_label,
        metadata: params.metadata
      }

      console.log('🔍 NotificationService - Insert data:', insertData)

      const { error } = await supabase
        .from('notifications')
        .insert(insertData)

      if (error) {
        console.error('🔍 NotificationService - Database error:', error)
        return null
      }

      console.log('🔍 NotificationService - Successfully created notification:', notificationId)
      return notificationId
    } catch (error) {
      console.error('🔍 NotificationService - Exception:', error)
      return null
    }
  }

  static async notifyOverdueQuotation(quotation: any, daysOverdue: number): Promise<void> {
    const notificationId = await this.createNotification({
      user_id: quotation.assigned_user_id || 1, // fallback to admin
      type: 'overdue',
      priority: daysOverdue > 7 ? 'urgent' : 'high',
      title: `Quotation #${quotation.id} is overdue`,
      message: `${quotation.client_name}'s quotation has been overdue for ${daysOverdue} days in ${quotation.workflow_status} stage`,
      quotation_id: quotation.id,
      action_url: `/sales/quotations?focus=${quotation.id}`,
      action_label: 'View & Take Action',
      metadata: {
        days_overdue: daysOverdue,
        original_status: quotation.workflow_status,
        client_name: quotation.client_name
      }
    })

    // Also notify business heads for urgent cases
    if (daysOverdue > 5) {
      await this.createNotification({
        user_id: 1, // business head - should be dynamic
        type: 'overdue',
        priority: 'urgent',
        title: `⚠️ Critical: Quotation overdue ${daysOverdue} days`,
        message: `${quotation.client_name} - ₹${quotation.total_amount?.toLocaleString()} stuck in ${quotation.workflow_status}`,
        quotation_id: quotation.id,
        action_url: `/sales/quotations?focus=${quotation.id}`,
        action_label: 'Investigate Now',
        metadata: {
          escalated: true,
          days_overdue: daysOverdue,
          value_at_risk: quotation.total_amount
        }
      })
    }
  }

  static async notifyApprovalNeeded(quotation: any, approver_id: number): Promise<void> {
    await this.createNotification({
      user_id: approver_id,
      type: 'approval_needed',
      priority: 'high',
      title: `New quotation pending your approval`,
      message: `${quotation.client_name} - ₹${quotation.total_amount?.toLocaleString()} quotation needs approval`,
      quotation_id: quotation.id,
      action_url: `/sales/quotations?focus=${quotation.id}`,
      action_label: 'Approve/Reject',
      metadata: {
        quotation_value: quotation.total_amount,
        client_name: quotation.client_name,
        submitted_by: quotation.created_by
      }
    })
  }

  static async notifyPaymentReceived(quotation: any, payment_amount: number): Promise<void> {
    // Notify the sales rep
    await this.createNotification({
      user_id: quotation.assigned_user_id || quotation.created_by,
      type: 'payment_received',
      priority: 'medium',
      title: `🎉 Payment received for ${quotation.client_name}`,
      message: `₹${payment_amount.toLocaleString()} payment confirmed. Ready for delivery confirmation.`,
      quotation_id: quotation.id,
      action_url: `/sales/quotations?focus=${quotation.id}`,
      action_label: 'Confirm Delivery',
      metadata: {
        payment_amount,
        client_name: quotation.client_name
      }
    })

    // Notify business head
    await this.createNotification({
      user_id: 1, // business head
      type: 'payment_received',
      priority: 'low',
      title: `💰 Payment received - ₹${payment_amount.toLocaleString()}`,
      message: `${quotation.client_name} payment confirmed`,
      quotation_id: quotation.id,
      action_url: `/sales/quotations`,
      action_label: 'View Dashboard',
      metadata: {
        payment_amount,
        client_name: quotation.client_name
      }
    })
  }

  static async notifyClientFollowup(quotation: any, assigned_user_id: number): Promise<void> {
    await this.createNotification({
      user_id: assigned_user_id,
      type: 'client_followup',
      priority: 'medium',
      title: `Follow up with ${quotation.client_name}`,
      message: `Quotation worth ₹${quotation.total_amount?.toLocaleString()} needs client follow-up`,
      quotation_id: quotation.id,
      action_url: `/sales/quotations?focus=${quotation.id}`,
      action_label: 'Contact Client',
      metadata: {
        client_name: quotation.client_name,
        quotation_value: quotation.total_amount,
        last_contact: quotation.client_verbal_confirmation_date
      }
    })
  }

  static async notifyAutomationAction(user_id: number, action: string, quotation: any): Promise<void> {
    await this.createNotification({
      user_id,
      type: 'automation',
      priority: 'low',
      title: `🤖 Automation: ${action}`,
      message: `System automatically ${action} for ${quotation.client_name}`,
      quotation_id: quotation.id,
      action_url: `/sales/quotations?focus=${quotation.id}`,
      action_label: 'View Details',
      metadata: {
        automation_action: action,
        client_name: quotation.client_name,
        triggered_at: new Date().toISOString()
      }
    })
  }

  static async bulkNotifyOverdue(overdueQuotations: any[]): Promise<void> {
    const promises = overdueQuotations.map(quotation => {
      const daysOverdue = quotation.days_overdue || 0
      return this.notifyOverdueQuotation(quotation, daysOverdue)
    })

    await Promise.allSettled(promises)
  }

  // Cleanup expired notifications
  static async cleanupExpiredNotifications(): Promise<number> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select()

      if (error) {
        console.error('Error cleaning up expired notifications:', error)
        return 0
      }

      return (data || []).length
    } catch (error) {
      console.error('Error in cleanupExpiredNotifications:', error)
      return 0
    }
  }
} 