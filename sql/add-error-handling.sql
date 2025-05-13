-- Update function with robust error handling
CREATE OR REPLACE FUNCTION auto_reassign_leads_on_employee_status_change()
RETURNS TRIGGER AS $$
BEGIN
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
                NEW.first_name || ' ' || NEW.last_name,
                'Automatically reassigned leads due to employee status change to ' || NEW.status,
                'System'
            );
            
            -- Update all leads assigned to this employee, except those with 'WON' or 'REJECTED' status
            UPDATE leads
            SET 
                assigned_to = NULL,
                status = 'UNASSIGNED',
                updated_at = NOW()
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
                'Lead automatically moved to unassigned pool due to ' || NEW.first_name || ' ' || NEW.last_name || ' status change to ' || NEW.status,
                'System'
            FROM leads
            WHERE assigned_to = NEW.id AND UPPER(status) NOT IN ('WON', 'REJECTED');
                
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
                COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Unknown'),
                'Error in auto_reassign_leads: ' || SQLERRM,
                'System'
            );
            
            -- Continue with the trigger (don't abort the employee status change)
            -- But log the failure
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
