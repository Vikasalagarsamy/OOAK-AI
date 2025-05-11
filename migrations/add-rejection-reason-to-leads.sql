-- Check if the rejection_reason column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'rejection_reason'
    ) THEN
        -- Add rejection_reason column to the leads table
        ALTER TABLE leads ADD COLUMN rejection_reason TEXT;
        
        -- Add rejected_at timestamp column to track when the lead was rejected
        ALTER TABLE leads ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
        
        -- Add rejected_by column to track who rejected the lead
        ALTER TABLE leads ADD COLUMN rejected_by UUID;
    END IF;
END
$$;
