export type NotificationType = 'overdue' | 'approval_needed' | 'payment_received' | 'client_followup' | 'automation' | 'system'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notification {
  id: string
  user_id: number
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  quotation_id?: number
  is_read: boolean
  created_at: string
  expires_at?: string
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
}

export interface NotificationSettings {
  user_id: number
  email_enabled: boolean
  in_app_enabled: boolean
  overdue_alerts: boolean
  approval_alerts: boolean
  payment_alerts: boolean
  automation_alerts: boolean
  email_frequency: 'immediate' | 'daily' | 'weekly'
  quiet_hours_start?: string
  quiet_hours_end?: string
}

export interface EmailNotificationTemplate {
  id: string
  name: string
  subject: string
  html_template: string
  text_template: string
  variables: string[]
}

export interface NotificationRule {
  id: string
  name: string
  trigger_type: NotificationType
  conditions: Record<string, any>
  recipients: ('sales_rep' | 'business_head' | 'admin')[]
  template_id?: string
  enabled: boolean
  created_by: number
  created_at: string
} 