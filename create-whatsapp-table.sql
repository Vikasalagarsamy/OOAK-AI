-- Create WhatsApp Messages Table for Real-Time Testing
-- This table will store WhatsApp messages for AI analysis

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  from_phone VARCHAR(50) NOT NULL,
  to_phone VARCHAR(50),
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_phone ON whatsapp_messages(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);

-- Insert a test message to verify table works
INSERT INTO whatsapp_messages (
  message_id, 
  from_phone, 
  to_phone, 
  content, 
  message_type, 
  timestamp
) VALUES (
  'test_msg_' || extract(epoch from now()),
  '919677362524',
  'business_phone',
  'Test message to verify WhatsApp table is working',
  'text',
  NOW()
) ON CONFLICT (message_id) DO NOTHING;

-- Verify the table was created and has data
SELECT 
  'WhatsApp table created successfully!' as status,
  COUNT(*) as message_count 
FROM whatsapp_messages; 