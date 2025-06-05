-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('overdue', 'approval_needed', 'payment_received', 'client_followup', 'automation', 'system')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  quotation_id INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_quotation_id ON notifications(quotation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);

-- Add RLS (Row Level Security) policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id::text = auth.jwt() ->> 'sub');

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id::text = auth.jwt() ->> 'sub');

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id::text = auth.jwt() ->> 'sub');

-- Policy: System can insert notifications for any user (for automated notifications)
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id INTEGER PRIMARY KEY,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  overdue_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  approval_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  payment_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  automation_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  email_frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for notification settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own notification settings
CREATE POLICY "Users can manage own notification settings" ON notification_settings
  FOR ALL USING (user_id::text = auth.jwt() ->> 'sub');

-- Create notification rules table for automation
CREATE TABLE IF NOT EXISTS notification_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('overdue', 'approval_needed', 'payment_received', 'client_followup', 'automation', 'system')),
  conditions JSONB NOT NULL DEFAULT '{}',
  recipients TEXT[] NOT NULL DEFAULT '{}',
  template_id TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for notification rules
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage notification rules (simplified for now)
CREATE POLICY "Admins can manage notification rules" ON notification_rules
  FOR ALL USING (true);

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_notification_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for email templates
ALTER TABLE email_notification_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage email templates (simplified for now)
CREATE POLICY "Admins can manage email templates" ON email_notification_templates
  FOR ALL USING (true);

-- Insert default notification settings for existing users (if employees table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
    INSERT INTO notification_settings (user_id)
    SELECT id FROM employees
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Insert default email templates
INSERT INTO email_notification_templates (id, name, subject, html_template, text_template, variables) VALUES
('overdue_template', 'Overdue Quotation Alert', 'Quotation #{quotation_id} is overdue', 
 '<h2>Quotation Overdue Alert</h2><p>Quotation #{quotation_id} for {client_name} has been overdue for {days_overdue} days.</p><p><a href="{action_url}">Take Action</a></p>',
 'Quotation #{quotation_id} for {client_name} has been overdue for {days_overdue} days. Take action: {action_url}',
 ARRAY['quotation_id', 'client_name', 'days_overdue', 'action_url']),
('approval_template', 'Approval Required', 'Quotation #{quotation_id} needs your approval', 
 '<h2>Approval Required</h2><p>Quotation #{quotation_id} for {client_name} worth ₹{quotation_value} needs your approval.</p><p><a href="{action_url}">Review & Approve</a></p>',
 'Quotation #{quotation_id} for {client_name} worth ₹{quotation_value} needs your approval. Review: {action_url}',
 ARRAY['quotation_id', 'client_name', 'quotation_value', 'action_url']),
('payment_template', 'Payment Received', 'Payment received for quotation #{quotation_id}', 
 '<h2>Payment Received</h2><p>Payment of ₹{payment_amount} has been received for {client_name}.</p><p><a href="{action_url}">View Details</a></p>',
 'Payment of ₹{payment_amount} has been received for {client_name}. View details: {action_url}',
 ARRAY['quotation_id', 'client_name', 'payment_amount', 'action_url'])
ON CONFLICT (id) DO NOTHING; 