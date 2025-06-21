import { createClient } from '@/lib/postgresql-client'

export class BusinessNotificationService {
  
  // 🎯 QUOTATION LIFECYCLE NOTIFICATIONS
  
  static async notifyQuotationCreated(quotation: any, createdBy: string) {
    console.log('🔔 Sending quotation created notifications')
    
    await this.createNotification({
      type: 'quotation_created',
      title: '📝 New Quotation Created',
      message: `Quotation #${quotation.quotation_number} (₹${this.formatAmount(quotation.total_amount)}) created for ${quotation.client_name}`,
      priority: 'medium',
      metadata: { quotation_id: quotation.id, business_event: true, action: 'created' }
    })
  }

  static async notifyQuotationSubmittedForApproval(quotation: any, submittedBy: string) {
    console.log('🔔 Sending approval request notifications')
    
    await this.createNotification({
      type: 'approval_required',
      title: '⏳ Quotation Approval Required',
      message: `Quotation #${quotation.quotation_number} (₹${this.formatAmount(quotation.total_amount)}) requires approval`,
      priority: 'high',
      metadata: { quotation_id: quotation.id, business_event: true, action: 'approval_required' }
    })
  }

  static async notifyQuotationApproved(quotation: any, approvedBy: string) {
    console.log('🔔 Sending quotation approved notifications')
    
    await this.createNotification({
      type: 'quotation_approved',
      title: '🎉 Quotation Approved!',
      message: `Quotation #${quotation.quotation_number} for ${quotation.client_name} has been approved!`,
      priority: 'high',
      metadata: { quotation_id: quotation.id, business_event: true, action: 'approved' }
    })
  }

  static async notifyPaymentReceived(quotation: any, paymentAmount: number, receivedBy: string) {
    console.log('🔔 Sending payment received notifications')
    
    await this.createNotification({
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

  // 🤖 AI INSIGHTS NOTIFICATIONS
  
  static async notifyLowSuccessProbability(quotation: any, probability: number) {
    console.log(`🔔 Sending low success probability alert (${probability}%)`)
    
    await this.createNotification({
      type: 'ai_alert_low_probability',
      title: '⚠️ AI Alert: Low Success Probability',
      message: `AI predicts ${probability}% success for quotation #${quotation.quotation_number}. Consider follow-up actions.`,
      priority: 'urgent',
      metadata: { 
        quotation_id: quotation.id, 
        ai_probability: probability,
        business_event: true,
        action: 'ai_alert'
      }
    })
  }

  static async notifyRevenueForecastChange(oldForecast: number, newForecast: number, changePercent: number) {
    console.log(`🔔 Sending revenue forecast change notification (${changePercent}% change)`)
    
    if (Math.abs(changePercent) < 10) return // Only notify for significant changes
    
    const priority = Math.abs(changePercent) > 25 ? 'urgent' : 'high'
    
    await this.createNotification({
      type: 'revenue_forecast_change',
      title: `📈 Revenue Forecast ${changePercent > 0 ? 'Increased' : 'Decreased'}`,
      message: `Revenue forecast changed from ₹${this.formatAmount(oldForecast)} to ₹${this.formatAmount(newForecast)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)`,
      priority,
      metadata: { 
        old_forecast: oldForecast,
        new_forecast: newForecast,
        change_percent: changePercent,
        business_event: true,
        action: 'forecast_change'
      }
    })
  }

  static async notifyTeamPerformanceAnomaly(employee: any, anomalyType: string, metrics: any) {
    console.log(`🔔 Sending team performance anomaly notification for ${employee.full_name}`)
    
    await this.createNotification({
      type: 'performance_anomaly',
      title: `👤 Performance Alert: ${employee.full_name}`,
      message: `${anomalyType}: ${this.getAnomalyMessage(anomalyType, metrics)}`,
      priority: 'high',
      metadata: { 
        employee_id: employee.employee_id,
        anomaly_type: anomalyType,
        metrics: metrics,
        business_event: true,
        action: 'performance_anomaly'
      }
    })
  }

  // 📅 BUSINESS PROCESS NOTIFICATIONS

  static async notifyEventDeadlineApproaching(quotation: any, event: any, daysUntil: number) {
    console.log(`🔔 Sending event deadline notification (${daysUntil} days until ${event.event_name})`)
    
    const priority = daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'high' : 'medium'
    
    await this.createNotification({
      type: 'event_deadline_approaching',
      title: `⏰ Event Deadline Approaching`,
      message: `${event.event_name} for ${quotation.client_name} is in ${daysUntil} days (${new Date(event.event_date).toLocaleDateString()})`,
      priority,
      metadata: { 
        quotation_id: quotation.id,
        event_id: event.id,
        days_until: daysUntil,
        business_event: true,
        action: 'deadline_approaching'
      }
    })
  }

  static async notifyFollowUpDue(followUp: any) {
    console.log(`🔔 Sending follow-up due notification`)
    
    await this.createNotification({
      type: 'followup_due',
      title: '📞 Follow-up Due',
      message: `Follow-up required for ${followUp.leads?.name || 'lead'} - ${followUp.notes || 'No additional notes'}`,
      priority: 'medium',
      metadata: { 
        followup_id: followUp.id,
        lead_id: followUp.lead_id,
        business_event: true,
        action: 'followup_due'
      }
    })
  }

  // 🔧 UTILITY METHODS

  private static async createNotification(notification: {
    type: string
    title: string
    message: string
    priority: string
    metadata: any
  }) {
    // PostgreSQL direct query
    
    const notificationData = {
      id: `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: 1, // For now, send to admin user
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: notification.metadata
    }

    try {
      await query(`INSERT INTO notifications (id, user_id, type, title, message, priority, is_read, created_at, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [notificationData.id, notificationData.user_id, notificationData.type, notificationData.title, notificationData.message, notificationData.priority, notificationData.is_read, notificationData.created_at, JSON.stringify(notificationData.metadata)])
      console.log(`✅ Business notification created: ${notification.title}`)
    } catch (error) {
      console.error(`❌ Failed to create business notification:`, error)
    }
  }

  private static formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount)
  }

  private static getAnomalyMessage(anomalyType: string, metrics: any): string {
    switch (anomalyType) {
      case 'conversion_rate_drop':
        return `Conversion rate dropped to ${metrics.conversion_rate}% (below ${metrics.threshold}% threshold)`
      case 'activity_decrease':
        return `Activity score decreased to ${metrics.activity_score} (${metrics.decrease}% decrease)`
      case 'revenue_underperformance':
        return `Revenue: ₹${this.formatAmount(metrics.revenue)} (${metrics.performance}% of target)`
      default:
        return `Performance metrics require attention`
    }
  }
} 