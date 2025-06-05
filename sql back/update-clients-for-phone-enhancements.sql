-- Add country_code and is_whatsapp columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT '+91',
ADD COLUMN IF NOT EXISTS is_whatsapp BOOLEAN DEFAULT FALSE;

-- Update existing records to set default country code
UPDATE clients 
SET country_code = '+91' 
WHERE country_code IS NULL AND phone IS NOT NULL;
