-- Function to automatically reassign leads when employee status changes
CREATE OR REPLACE FUNCTION auto_reassign_leads_on_employee_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status is changing to 'inactive', 'on_leave', or 'terminated'
    IF (NEW.status = 'inactive' OR NEW.status = 'on_leave' OR NEW.status = 'terminated') AND
       (OLD.status != NEW.status) THEN
        
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
            'lead',
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
            AND status NOT IN ('WON', 'REJECTED');
            
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
        WHERE assigned_to = NEW.id AND status NOT IN ('WON', 'REJECTED');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to execute the function whenever an employee's status is updated
DROP TRIGGER IF EXISTS employee_status_change_trigger ON employees;
CREATE TRIGGER employee_status_change_trigger
AFTER UPDATE OF status ON employees
FOR EACH ROW
EXECUTE FUNCTION auto_reassign_leads_on_employee_status_change();
