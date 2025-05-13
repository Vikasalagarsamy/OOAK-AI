-- First, check if the lead_followups table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lead_followups'
    ) THEN
        -- Create the table if it doesn't exist
        CREATE TABLE lead_followups (
            id SERIAL PRIMARY KEY,
            lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
            scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
            completed_at TIMESTAMP WITH TIME ZONE,
            contact_method TEXT NOT NULL,
            interaction_summary TEXT,
            status TEXT NOT NULL DEFAULT 'scheduled',
            outcome TEXT,
            notes TEXT,
            priority TEXT NOT NULL DEFAULT 'medium',
            created_by TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_by TEXT,
            updated_at TIMESTAMP WITH TIME ZONE,
            completed_by TEXT,
            duration_minutes INTEGER,
            follow_up_required BOOLEAN DEFAULT FALSE,
            next_follow_up_date TIMESTAMP WITH TIME ZONE
        );
        
        RAISE NOTICE 'Created lead_followups table';
    ELSE
        -- Check if followup_type column exists
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'lead_followups' AND column_name = 'followup_type'
        ) THEN
            -- Check if contact_method column exists
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'lead_followups' AND column_name = 'contact_method'
            ) THEN
                -- Add contact_method column and copy data from followup_type
                ALTER TABLE lead_followups ADD COLUMN contact_method TEXT;
                UPDATE lead_followups SET contact_method = followup_type;
                ALTER TABLE lead_followups ALTER COLUMN contact_method SET NOT NULL;
                
                RAISE NOTICE 'Added contact_method column and copied data from followup_type';
            END IF;
        ELSE
            -- Check if contact_method column exists
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'lead_followups' AND column_name = 'contact_method'
            ) THEN
                -- Add contact_method column
                ALTER TABLE lead_followups ADD COLUMN contact_method TEXT NOT NULL DEFAULT 'phone';
                
                RAISE NOTICE 'Added contact_method column with default value';
            END IF;
        END IF;
    END IF;
END $$;
