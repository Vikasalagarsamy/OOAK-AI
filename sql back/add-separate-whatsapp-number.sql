-- Add columns for separate WhatsApp number
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS whatsapp_country_code VARCHAR(10) DEFAULT '+91';

-- Update the meaning of is_whatsapp to indicate if primary phone is used for WhatsApp
COMMENT ON COLUMN clients.is_whatsapp IS 'If true and whatsapp_number is NULL, primary phone is used for WhatsApp. If false, no WhatsApp number is available.';
