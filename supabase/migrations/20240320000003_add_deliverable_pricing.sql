-- Add pricing columns to deliverables table
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS basic_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS premium_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS elite_price DECIMAL(10,2) DEFAULT 0.00;

-- Add indexes for pricing columns for better performance
CREATE INDEX IF NOT EXISTS deliverables_basic_price_idx ON deliverables(basic_price);
CREATE INDEX IF NOT EXISTS deliverables_premium_price_idx ON deliverables(premium_price);
CREATE INDEX IF NOT EXISTS deliverables_elite_price_idx ON deliverables(elite_price);

-- Update existing records to have default pricing (optional)
UPDATE deliverables 
SET 
  basic_price = 0.00,
  premium_price = 0.00,
  elite_price = 0.00
WHERE basic_price IS NULL OR premium_price IS NULL OR elite_price IS NULL; 