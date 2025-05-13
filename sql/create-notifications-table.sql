-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);

-- Add sample notifications
INSERT INTO notifications (title, message, type, link, user_id)
VALUES 
  ('Welcome to the Portal', 'Thanks for joining ONE OF A KIND PORTAL. Start exploring our features!', 'info', '/', '00000000-0000-0000-0000-000000000000'),
  ('New feature available', 'Check out our new reporting dashboard with advanced analytics.', 'success', '/reports', '00000000-0000-0000-0000-000000000000'),
  ('Action required', 'Please update your profile information.', 'warning', '/profile', '00000000-0000-0000-0000-000000000000'),
  ('System maintenance', 'The system will be unavailable on Sunday from 2AM to 4AM for scheduled maintenance.', 'info', null, '00000000-0000-0000-0000-000000000000'),
  ('Security alert', 'We detected a login from a new device. Please verify this was you.', 'error', '/settings/security', '00000000-0000-0000-0000-000000000000');

-- Create function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(20),
  p_link TEXT,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (title, message, type, link, user_id)
  VALUES (p_title, p_message, p_type, p_link, p_user_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;
