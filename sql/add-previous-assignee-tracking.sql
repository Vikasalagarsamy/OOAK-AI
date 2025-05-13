-- Add previous_assigned_to column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS previous_assigned_to INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reassignment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reassignment_reason VARCHAR(50);

-- Create index on previous_assigned_to for reporting queries
CREATE INDEX IF NOT EXISTS idx_leads_prev_assigned ON leads(previous_assigned_to);

-- Update the function to track previous assignee
CREATE OR REPLACE FUNCTION auto_reassign_leads_on_employee_status_change()
RETURNS TRIGGER AS $$
DECLARE
    affected_count INTEGER;
    employee_name TEXT;
BEGIN
    -- Set employee name for use in notifications
    employee_name := NEW.first_name || ' ' || NEW.last_name;
    
    -- Use LOWER() for case-insensitive comparison of status values
    IF (LOWER(NEW.status) IN ('inactive', 'on_leave', 'terminated')) AND
       (LOWER(OLD.status) != LOWER(NEW.status)) THEN
        
        BEGIN -- Inner block for error handling
            -- Insert a record into activities table to log this automatic reassignment
            INSERT INTO activities (
                action_type,
                entity_type,
                entity_id,
                entity_name,
                description,
                user_name
            ) VALUES (
                'auto_reassign',
                'employee',
                NEW.id::text,
                employee_name,
                'Automatically reassigned leads due to employee status change to ' || NEW.status,
                'System'
            );
            
            -- Get count of affected leads for notification
            SELECT COUNT(*) INTO affected_count
            FROM leads
            WHERE assigned_to = NEW.id 
            AND UPPER(status) NOT IN ('WON', 'REJECTED');
            
            -- Update all leads assigned to this employee, except those with 'WON' or 'REJECTED' status
            -- Now tracking previous assignee information
            UPDATE leads
            SET 
                previous_assigned_to = assigned_to,
                assigned_to = NULL,
                status = 'UNASSIGNED',
                updated_at = NOW(),
                reassignment_date = NOW(),
                reassignment_reason = 'EMPLOYEE_STATUS_' || UPPER(NEW.status)
            WHERE 
                assigned_to = NEW.id 
                AND UPPER(status) NOT IN ('WON', 'REJECTED');
                
            -- Log this action in the activities table for each affected lead
            INSERT INTO activities (
                action_type,
                entity_type,
                entity_id,
                entity_name,
                description,
                user_name
            )
            SELECT 
                'auto_reassign',
                'lead',
                id::text,
                lead_number,
                'Lead automatically moved to unassigned pool due to ' || employee_name || ' status change to ' || NEW.status,
                'System'
            FROM leads
            WHERE previous_assigned_to = NEW.id 
            AND reassignment_reason = 'EMPLOYEE_STATUS_' || UPPER(NEW.status)
            AND reassignment_date >= NOW() - INTERVAL '5 minutes';
            
            -- Notify administrators if any leads were affected
            IF affected_count > 0 THEN
                PERFORM notify_admins_of_lead_reassignment(
                    NEW.id,
                    employee_name,
                    NEW.status,
                    affected_count
                );
            END IF;
                
        EXCEPTION WHEN OTHERS THEN
            -- Log the error
            INSERT INTO activities (
                action_type,
                entity_type,
                entity_id,
                entity_name,
                description,
                user_name
            ) VALUES (
                'error',
                'employee',
                NEW.id::text,
                COALESCE(employee_name, 'Unknown'),
                'Error in auto_reassign_leads: ' || SQLERRM,
                'System'
            );
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
