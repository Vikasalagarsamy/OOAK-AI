-- =============================================================================
-- ADD DELIVERABLE PRICING COLUMNS
-- Run this script in your Supabase SQL Editor
-- =============================================================================

-- Add pricing columns to deliverables table
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS basic_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS premium_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS elite_price DECIMAL(10,2) DEFAULT 0.00;

-- Add indexes for pricing columns for better performance
CREATE INDEX IF NOT EXISTS deliverables_basic_price_idx ON deliverables(basic_price);
CREATE INDEX IF NOT EXISTS deliverables_premium_price_idx ON deliverables(premium_price);
CREATE INDEX IF NOT EXISTS deliverables_elite_price_idx ON deliverables(elite_price);

-- Update existing records to have default pricing
UPDATE deliverables 
SET 
  basic_price = COALESCE(basic_price, 0.00),
  premium_price = COALESCE(premium_price, 0.00),
  elite_price = COALESCE(elite_price, 0.00);

-- Verify the changes
SELECT 
  'Pricing columns added successfully' as status,
  COUNT(*) as total_deliverables,
  COUNT(CASE WHEN basic_price IS NOT NULL THEN 1 END) as has_basic_price,
  COUNT(CASE WHEN premium_price IS NOT NULL THEN 1 END) as has_premium_price,
  COUNT(CASE WHEN elite_price IS NOT NULL THEN 1 END) as has_elite_price
FROM deliverables;

-- Show sample data structure
SELECT 
  id,
  deliverable_name,
  process_name,
  basic_price,
  premium_price,
  elite_price
FROM deliverables 
LIMIT 5; 