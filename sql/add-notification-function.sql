-- Create function to notify administrators about lead reassignments
CREATE OR REPLACE FUNCTION notify_admins_of_lead_reassignment(
    employee_id INTEGER,
    employee_name TEXT,
    new_status TEXT,
    affected_leads_count INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Insert notifications for all administrators and sales heads
    INSERT INTO notifications (
        user_id,
        message,
        type,
        is_read,
        created_at
    )
    SELECT 
        ua.id,
        affected_leads_count || ' leads automatically reassigned from ' || employee_name || 
        ' due to status change to ' || new_status,
        'lead_reassignment',
        FALSE,
        NOW()
    FROM user_accounts ua
    JOIN roles r ON ua.role_id = r.id
    WHERE r.title IN ('Administrator', 'Sales Head');
END;
$$ LANGUAGE plpgsql;

-- Update the main function to use the notification function
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
                'Lead automatically moved to unassigned pool due to ' || employee_name || ' status change to ' || NEW.status,
                'System'
            FROM leads
            WHERE assigned_to = NEW.id AND UPPER(status) NOT IN ('WON', 'REJECTED');
            
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
