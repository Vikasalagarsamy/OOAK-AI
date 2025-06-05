import { createClient } from '@/lib/supabase/server'
import type { WorkflowStatus } from '@/types/quotation-workflow'

interface NotificationRequest {
  user_id: number
  type: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: any
  batch_key?: string
}

interface NotificationRecipient {
  user_id: number
  role: string
  email?: string
}

export class EnhancedNotificationService {
  
  // 🎯 SMART NOTIFICATION CREATION WITH BATCHING
  
  static async createNotification(request: NotificationRequest): Promise<boolean> {
    const supabase = createClient()
    
    try {
      // Performance timing
      const startTime = Date.now()
      
      // Check if notification should be batched
      if (request.batch_key) {
        const shouldBatch = await this.checkBatching(
          request.user_id,
          request.type,
          request.batch_key
        )
        
        if (shouldBatch) {
          console.log(`🔄 Batching notification: ${request.type} for user ${request.user_id}`)
          return true // Notification was batched, not sent immediately
        }
      }
      
      // Create the notification
      const notificationData = {
        id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: request.user_id,
        type: request.type,
        title: request.title,
        message: request.message,
        priority: request.priority,
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: {
          ...request.metadata,
          enhanced: true,
          created_by_service: 'EnhancedNotificationService'
        }
      }

      const { error } = await supabase.from('notifications').insert(notificationData)
      
      if (error) {
        console.error(`❌ Failed to create notification:`, error)
        return false
      }
      
      // Log performance metric
      const duration = Date.now() - startTime
      await this.logPerformanceMetric('notification_creation', duration)
      
      console.log(`✅ Enhanced notification created: ${request.title}`)
      return true
      
    } catch (error) {
      console.error(`❌ Exception creating notification:`, error)
      return false
    }
  }

  // 🔄 BATCHING LOGIC
  
  private static async checkBatching(
    userId: number,
    type: string,
    batchKey: string,
    windowMinutes: number = 15
  ): Promise<boolean> {
    const supabase = createClient()
    
    try {
      const { data } = await supabase
        .rpc('should_batch_notification', {
          p_user_id: userId,
          p_type: type,
          p_batch_key: batchKey,
          p_batch_window_minutes: windowMinutes
        })
      
      return data || false
    } catch (error) {
      console.error('Error checking batching:', error)
      return false // Don't batch if there's an error
    }
  }

  // 👥 ROLE-BASED NOTIFICATION ROUTING
  
  static async notifyByRole(
    roles: string[],
    notification: Omit<NotificationRequest, 'user_id'>
  ): Promise<number> {
    const recipients = await this.getUsersByRole(roles)
    let successCount = 0
    
    // Send notifications in parallel for better performance
    const promises = recipients.map(async (recipient) => {
      const success = await this.createNotification({
        ...notification,
        user_id: recipient.user_id,
        metadata: {
          ...notification.metadata,
          recipient_role: recipient.role
        }
      })
      
      if (success) successCount++
    })
    
    await Promise.allSettled(promises)
    
    console.log(`📊 Role-based notifications sent: ${successCount}/${recipients.length}`)
    return successCount
  }

  // 🎯 BUSINESS EVENT NOTIFICATIONS (Enhanced)
  
  static async notifyQuotationCreated(quotation: any, createdBy: string): Promise<void> {
    console.log('🔔 Sending enhanced quotation created notifications')
    
    // Notify management
    await this.notifyByRole(['Sales Head', 'Administrator'], {
      type: 'quotation_created',
      title: '📝 New Quotation Created',
      message: `Quotation #${quotation.quotation_number} (₹${this.formatAmount(quotation.total_amount)}) created for ${quotation.client_name}`,
      priority: 'medium',
      batch_key: `quotation_created_${new Date().toDateString()}`, // Batch by day
      metadata: { 
        quotation_id: quotation.id, 
        business_event: true, 
        action: 'created',
        amount: quotation.total_amount
      }
    })
    
    // Notify creator (different priority, no batching)
    await this.createNotification({
      user_id: parseInt(createdBy),
      type: 'quotation_confirmation',
      title: '✅ Quotation Created Successfully',
      message: `Your quotation #${quotation.quotation_number} for ${quotation.client_name} has been created`,
      priority: 'low',
      metadata: { quotation_id: quotation.id, business_event: true, action: 'confirmation' }
    })
  }

  static async notifyQuotationApproved(quotation: any, approvedBy: string): Promise<void> {
    console.log('🔔 Sending enhanced quotation approved notifications')
    
    // High priority notification to creator
    await this.createNotification({
      user_id: quotation.created_by,
      type: 'quotation_approved',
      title: '🎉 Quotation Approved!',
      message: `Your quotation #${quotation.quotation_number} for ${quotation.client_name} has been approved!`,
      priority: 'high',
      metadata: { 
        quotation_id: quotation.id, 
        business_event: true, 
        action: 'approved',
        approved_by: approvedBy
      }
    })
    
    // Update management with approval
    await this.notifyByRole(['Administrator'], {
      type: 'quotation_approved_management',
      title: '✅ Quotation Approved',
      message: `Quotation #${quotation.quotation_number} (₹${this.formatAmount(quotation.total_amount)}) approved`,
      priority: 'medium',
      batch_key: `approvals_${new Date().toDateString()}`,
      metadata: { quotation_id: quotation.id, business_event: true, action: 'approved' }
    })
  }

  static async notifyPaymentReceived(quotation: any, paymentAmount: number, receivedBy: string): Promise<void> {
    console.log('🔔 Sending enhanced payment received notifications')
    
    // High priority to sales team
    await this.notifyByRole(['Sales Head', 'Administrator', 'Sales Representative'], {
      type: 'payment_received',
      title: '💰 Payment Received!',
      message: `Payment of ₹${this.formatAmount(paymentAmount)} received for quotation #${quotation.quotation_number}`,
      priority: 'high',
      metadata: { 
        quotation_id: quotation.id, 
        payment_amount: paymentAmount,
        business_event: true, 
        action: 'payment_received' 
      }
    })
  }

  // 🤖 AI-POWERED NOTIFICATIONS (Enhanced)
  
  static async notifyLowSuccessProbability(quotation: any, probability: number): Promise<void> {
    console.log(`🔔 Sending enhanced AI alert (${probability}% success)`)
    
    const urgencyLevel = probability < 15 ? 'urgent' : probability < 25 ? 'high' : 'medium'
    
    await this.createNotification({
      user_id: quotation.created_by,
      type: 'ai_alert_low_probability',
      title: '⚠️ AI Alert: Low Success Probability',
      message: `AI predicts ${probability}% success for quotation #${quotation.quotation_number}. ${this.getAIRecommendation(probability)}`,
      priority: urgencyLevel as any,
      metadata: { 
        quotation_id: quotation.id, 
        ai_probability: probability,
        business_event: true,
        action: 'ai_alert',
        urgency_level: urgencyLevel
      }
    })
  }

  // 📊 PERFORMANCE MONITORING
  
  private static async logPerformanceMetric(metric: string, value: number): Promise<void> {
    const supabase = createClient()
    
    try {
      await supabase.rpc('log_performance_metric', {
        metric_name: metric,
        metric_value: value,
        metric_unit: 'ms'
      })
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.warn('Failed to log performance metric:', error)
    }
  }

  // 🔧 UTILITY METHODS
  
  private static async getUsersByRole(roles: string[]): Promise<NotificationRecipient[]> {
    const supabase = createClient()
    
    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, email, role')
        .in('role', roles)
        .eq('is_active', true)
      
      return employees?.map(emp => ({
        user_id: emp.id,
        role: emp.role,
        email: emp.email
      })) || []
      
    } catch (error) {
      console.error('Error fetching users by role:', error)
      return [{ user_id: 1, role: 'Administrator' }] // Fallback
    }
  }

  private static formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount)
  }

  private static getAIRecommendation(probability: number): string {
    if (probability < 15) {
      return 'Immediate follow-up recommended.'
    } else if (probability < 25) {
      return 'Consider revising proposal or scheduling call.'
    } else {
      return 'Monitor closely and follow up within 24 hours.'
    }
  }

  // 📈 NOTIFICATION ANALYTICS
  
  static async getNotificationStats(userId?: number): Promise<any> {
    const supabase = createClient()
    
    try {
      let query = supabase.from('user_notification_summary').select('*')
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error fetching notification stats:', error)
      return null
    }
  }

  // 🧹 CLEANUP OPERATIONS
  
  static async cleanupOldNotifications(): Promise<number> {
    const supabase = createClient()
    
    try {
      const { data } = await supabase.rpc('archive_old_notifications')
      return data || 0
    } catch (error) {
      console.error('Error cleaning up notifications:', error)
      return 0
    }
  }
} 