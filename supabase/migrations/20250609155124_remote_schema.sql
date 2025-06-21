

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "audit_security";


ALTER SCHEMA "audit_security" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "master_data";


ALTER SCHEMA "master_data" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_employee"("p_first_name" character varying, "p_last_name" character varying, "p_email" character varying, "p_phone" character varying, "p_job_title" character varying, "p_department_id" integer, "p_designation_id" integer, "p_branch_id" integer, "p_hire_date" "date", "p_status" character varying, "p_notes" "text", "p_employee_id" character varying) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_employee_id INTEGER;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if the problematic trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_table = 'employees'
        AND trigger_name = 'employee_audit_trigger'
    ) INTO trigger_exists;
    
    -- If the trigger exists, temporarily disable it
    IF trigger_exists THEN
        EXECUTE 'ALTER TABLE employees DISABLE TRIGGER employee_audit_trigger';
    END IF;
    
    -- Insert the new employee
    INSERT INTO employees (
        first_name,
        last_name,
        email,
        phone,
        job_title,
        department_id,
        designation_id,
        branch_id,
        hire_date,
        status,
        notes,
        employee_id
    ) VALUES (
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        p_job_title,
        p_department_id,
        p_designation_id,
        p_branch_id,
        p_hire_date,
        p_status,
        p_notes,
        p_employee_id
    ) RETURNING id INTO new_employee_id;
    
    -- Log the activity to public.activities instead
    INSERT INTO activities (
        action_type,
        entity_type,
        entity_id,
        entity_name,
        description
    ) VALUES (
        'create',
        'employee',
        new_employee_id::text,
        p_first_name || ' ' || p_last_name,
        'New employee created'
    );
    
    -- Re-enable the trigger if it was disabled
    IF trigger_exists THEN
        EXECUTE 'ALTER TABLE employees ENABLE TRIGGER employee_audit_trigger';
    END IF;
    
    RETURN new_employee_id;
END;
$$;


ALTER FUNCTION "public"."add_employee"("p_first_name" character varying, "p_last_name" character varying, "p_email" character varying, "p_phone" character varying, "p_job_title" character varying, "p_department_id" integer, "p_designation_id" integer, "p_branch_id" integer, "p_hire_date" "date", "p_status" character varying, "p_notes" "text", "p_employee_id" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_employee"("p_first_name" character varying, "p_last_name" character varying, "p_email" character varying, "p_phone" character varying, "p_job_title" character varying, "p_department_id" integer, "p_designation_id" integer, "p_branch_id" integer, "p_hire_date" "date", "p_status" character varying, "p_notes" "text", "p_employee_id" character varying) IS 'Safely adds a new employee while bypassing audit_security schema permissions';



CREATE OR REPLACE FUNCTION "public"."analyze_view_performance"("p_view_name" "text", "p_hours" integer DEFAULT 24) RETURNS TABLE("total_queries" integer, "avg_execution_time_ms" double precision, "max_execution_time_ms" double precision, "avg_rows_returned" double precision, "last_execution" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_queries,
        ROUND(AVG(execution_time_ms)::numeric, 2) as avg_execution_time_ms,
        ROUND(MAX(execution_time_ms)::numeric, 2) as max_execution_time_ms,
        ROUND(AVG(rows_returned)::numeric, 2) as avg_rows_returned,
        MAX(created_at) as last_execution
    FROM query_performance_logs
    WHERE view_name = p_view_name
    AND created_at > (CURRENT_TIMESTAMP - (p_hours || ' hours')::interval);
END;
$$;


ALTER FUNCTION "public"."analyze_view_performance"("p_view_name" "text", "p_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_get_users_by_role"("p_role_id" integer) RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(users))
  INTO result
  FROM (
    SELECT 
      ua.id,
      ua.username,
      ua.email,
      CONCAT(e.first_name, ' ', e.last_name) AS name,
      r.title AS role_name
    FROM 
      public.user_accounts ua
    JOIN 
      public.employees e ON ua.employee_id = e.id
    JOIN 
      public.roles r ON ua.role_id = r.id
    WHERE 
      ua.role_id = p_role_id
      AND ua.is_active = true
  ) users;
  
  RETURN COALESCE(result, '[]'::JSON);
END;
$$;


ALTER FUNCTION "public"."api_get_users_by_role"("p_role_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_completed_tasks"("days_old" integer DEFAULT 90) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE ai_tasks 
  SET 
    archived = TRUE,
    archived_at = NOW()
  WHERE 
    status = 'COMPLETED' 
    AND completed_at < NOW() - INTERVAL '1 day' * days_old
    AND archived = FALSE;
    
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$;


ALTER FUNCTION "public"."archive_completed_tasks"("days_old" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_old_notifications"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move notifications older than 90 days to archive table
    CREATE TABLE IF NOT EXISTS notifications_archive (LIKE notifications INCLUDING ALL);
    
    WITH moved_notifications AS (
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '90 days'
        AND is_read = true
        RETURNING *
    )
    INSERT INTO notifications_archive SELECT * FROM moved_notifications;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Log the archival
    INSERT INTO system_logs (action, details, created_at) 
    VALUES ('notification_archive', 
            jsonb_build_object('archived_count', archived_count), 
            NOW());
    
    RETURN archived_count;
END;
$$;


ALTER FUNCTION "public"."archive_old_notifications"() OWNER TO "postgres";


CREATE PROCEDURE "public"."assign_all_unassigned_leads"(IN "p_assigned_by" "uuid" DEFAULT NULL::"uuid")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_lead_id UUID;
    v_lead_cursor CURSOR FOR 
        SELECT id FROM leads 
        WHERE status = 'unassigned' 
        ORDER BY created_at;
BEGIN
    OPEN v_lead_cursor;
    
    LOOP
        FETCH v_lead_cursor INTO v_lead_id;
        EXIT WHEN NOT FOUND;
        
        BEGIN
            CALL auto_assign_lead(v_lead_id, p_assigned_by, 'Batch assignment of unassigned leads');
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to assign lead %: %', v_lead_id, SQLERRM;
        END;
    END LOOP;
    
    CLOSE v_lead_cursor;
END;
$$;


ALTER PROCEDURE "public"."assign_all_unassigned_leads"(IN "p_assigned_by" "uuid") OWNER TO "postgres";


CREATE PROCEDURE "public"."assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_to" "uuid", IN "p_assigned_by" "uuid" DEFAULT NULL::"uuid", IN "p_notes" "text" DEFAULT NULL::"text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_current_status VARCHAR(50);
    v_user_exists BOOLEAN;
    v_lead_exists BOOLEAN;
    v_lead_number VARCHAR;
    v_client_name VARCHAR;
    v_assigner_name VARCHAR;
BEGIN
    -- Check if lead exists
    SELECT EXISTS(SELECT 1 FROM leads WHERE id = p_lead_id) INTO v_lead_exists;
    IF NOT v_lead_exists THEN
        RAISE EXCEPTION 'Lead with ID % does not exist', p_lead_id;
    END IF;
    
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = p_assigned_to) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'User with ID % does not exist', p_assigned_to;
    END IF;
    
    -- Get current lead status and details
    SELECT status, lead_number, client_name INTO v_current_status, v_lead_number, v_client_name 
    FROM leads WHERE id = p_lead_id;
    
    -- Get assigner name if provided
    IF p_assigned_by IS NOT NULL THEN
        SELECT first_name || ' ' || last_name INTO v_assigner_name 
        FROM users 
        WHERE id = p_assigned_by;
    ELSE
        v_assigner_name := 'System';
    END IF;
    
    -- Update the lead
    UPDATE leads
    SET 
        assigned_to = p_assigned_to,
        status = CASE 
                    WHEN v_current_status = 'unassigned' THEN 'assigned'
                    ELSE v_current_status
                 END,
        updated_at = NOW()
    WHERE id = p_lead_id;
    
    -- Record the assignment in history
    INSERT INTO lead_assignment_history (
        id,
        lead_id,
        assigned_to,
        assigned_by,
        assignment_date,
        notes
    ) VALUES (
        gen_random_uuid(),
        p_lead_id,
        p_assigned_to,
        p_assigned_by,
        NOW(),
        p_notes
    );
    
    -- Create notification for the assigned user
    INSERT INTO notifications (
        recipient_id,
        type,
        title,
        message,
        entity_type,
        entity_id
    ) VALUES (
        p_assigned_to,
        'lead_assigned',
        'New Lead Assigned',
        'You have been assigned lead #' || v_lead_number || ' (' || v_client_name || ') by ' || v_assigner_name,
        'lead',
        p_lead_id
    );
    
    RAISE NOTICE 'Lead % successfully assigned to user %', p_lead_id, p_assigned_to;
END;
$$;


ALTER PROCEDURE "public"."assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_to" "uuid", IN "p_assigned_by" "uuid", IN "p_notes" "text") OWNER TO "postgres";


CREATE PROCEDURE "public"."auto_assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_by" "uuid" DEFAULT NULL::"uuid", IN "p_notes" "text" DEFAULT 'Automatically assigned based on workload'::"text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_assigned_to UUID;
BEGIN
    -- Get the best user for assignment
    SELECT get_best_sales_user_for_lead() INTO v_assigned_to;
    
    IF v_assigned_to IS NULL THEN
        RAISE EXCEPTION 'No suitable sales team member found for assignment';
    END IF;
    
    -- Call the assign_lead procedure
    CALL assign_lead(p_lead_id, v_assigned_to, p_assigned_by, p_notes);
END;
$$;


ALTER PROCEDURE "public"."auto_assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_by" "uuid", IN "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_reassign_leads_on_employee_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."auto_reassign_leads_on_employee_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_remove_employees"("emp_ids" integer[]) RETURNS TABLE("employee_id" integer, "success" boolean, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    emp_id INTEGER;
    result_record RECORD;
BEGIN
    -- For each employee ID in the array
    FOREACH emp_id IN ARRAY emp_ids
    LOOP
        BEGIN
            -- First update any leads assigned to this employee
            UPDATE leads SET assigned_to = NULL WHERE assigned_to = emp_id;
            
            -- Remove from team_members if exists
            DELETE FROM team_members WHERE employee_id = emp_id;
            
            -- Update any teams where this employee is the lead
            UPDATE teams SET team_lead_id = NULL WHERE team_lead_id = emp_id;
            
            -- Update any departments where this employee is the manager
            UPDATE departments SET manager_id = NULL WHERE manager_id = emp_id;
            
            -- Update any branches where this employee is the manager
            UPDATE branches SET manager_id = NULL WHERE manager_id = emp_id;
            
            -- Delete from employee_companies to avoid foreign key constraints
            DELETE FROM employee_companies WHERE employee_id = emp_id;
            
            -- Delete any activities related to this employee if they exist
            -- This is a safe operation as it will only delete if records exist
            DELETE FROM activities 
            WHERE entity_type = 'employee' AND entity_id = emp_id::text;
            
            -- Finally delete the employee record
            DELETE FROM employees WHERE id = emp_id;
            
            -- Return success for this employee
            employee_id := emp_id;
            success := TRUE;
            message := 'Successfully deleted';
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- Return failure for this employee
            employee_id := emp_id;
            success := FALSE;
            message := 'Error: ' || SQLERRM;
            RETURN NEXT;
            
            -- Continue with the next employee
            CONTINUE;
        END;
    END LOOP;
    
    RETURN;
END;
$$;


ALTER FUNCTION "public"."batch_remove_employees"("emp_ids" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_admin_menu_permissions"() RETURNS TABLE("menu_item_id" integer, "menu_name" "text", "has_permission" boolean, "can_view" boolean, "can_add" boolean, "can_edit" boolean, "can_delete" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_admin_role_id INTEGER;
BEGIN
  -- Get the Administrator role ID - only using title or id
  SELECT id INTO v_admin_role_id 
  FROM roles 
  WHERE title = 'Administrator' OR id = 1
  LIMIT 1;
  
  -- If no admin role found, return empty result
  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Administrator role not found';
    RETURN;
  END IF;
  
  -- Return the permissions
  RETURN QUERY
  SELECT 
    mi.id AS menu_item_id,
    mi.name AS menu_name,
    (rmp.menu_item_id IS NOT NULL) AS has_permission,
    COALESCE(rmp.can_view, FALSE) AS can_view,
    COALESCE(rmp.can_add, FALSE) AS can_add,
    COALESCE(rmp.can_edit, FALSE) AS can_edit,
    COALESCE(rmp.can_delete, FALSE) AS can_delete
  FROM 
    menu_items mi
  LEFT JOIN 
    role_menu_permissions rmp ON mi.id = rmp.menu_item_id AND rmp.role_id = v_admin_role_id
  ORDER BY 
    mi.parent_id NULLS FIRST, mi.sort_order;
END;
$$;


ALTER FUNCTION "public"."check_admin_menu_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_completion_consistency"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If status is COMPLETED, ensure completed_at is set
  IF NEW.status = 'COMPLETED' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- If status is not COMPLETED, clear completed_at
  IF NEW.status != 'COMPLETED' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_completion_consistency"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_employee_primary_company"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Skip validation if the employee is being deleted
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    
    -- For other operations, perform the validation
    IF NOT EXISTS (
        SELECT 1 FROM employee_companies 
        WHERE employee_id = NEW.id AND is_primary = true
    ) THEN
        RAISE EXCEPTION 'Employee must have at least one primary company';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_employee_primary_company"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_primary_company"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If setting is_primary to false, check if there's another primary
    IF (TG_OP = 'UPDATE' AND OLD.is_primary = TRUE AND NEW.is_primary = FALSE) THEN
        IF NOT EXISTS (
            SELECT 1 FROM employee_companies 
            WHERE employee_id = NEW.employee_id 
            AND is_primary = TRUE 
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Employee must have at least one primary company';
        END IF;
    END IF;
    
    -- If deleting a primary company, check if there's another primary
    IF (TG_OP = 'DELETE' AND OLD.is_primary = TRUE) THEN
        IF NOT EXISTS (
            SELECT 1 FROM employee_companies 
            WHERE employee_id = OLD.employee_id 
            AND is_primary = TRUE 
            AND id != OLD.id
        ) THEN
            RAISE EXCEPTION 'Employee must have at least one primary company';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_primary_company"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_menu_permission"("p_user_id" "uuid", "p_menu_path" character varying, "p_permission" character varying DEFAULT 'view'::character varying) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_has_permission BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is an administrator (role_id = 1 or title = 'Administrator')
  SELECT EXISTS (
    SELECT 1 FROM user_accounts ua
    JOIN roles r ON ua.role_id = r.id
    WHERE ua.id = p_user_id AND (r.id = 1 OR r.title = 'Administrator')
  ) INTO v_is_admin;
  
  -- Administrators have all permissions
  IF v_is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  CASE p_permission
    WHEN 'view' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_menu_permissions
        WHERE user_id = p_user_id AND menu_path = p_menu_path AND can_view = TRUE
      ) INTO v_has_permission;
    WHEN 'add' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_menu_permissions
        WHERE user_id = p_user_id AND menu_path = p_menu_path AND can_add = TRUE
      ) INTO v_has_permission;
    WHEN 'edit' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_menu_permissions
        WHERE user_id = p_user_id AND menu_path = p_menu_path AND can_edit = TRUE
      ) INTO v_has_permission;
    WHEN 'delete' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_menu_permissions
        WHERE user_id = p_user_id AND menu_path = p_menu_path AND can_delete = TRUE
      ) INTO v_has_permission;
    ELSE
      v_has_permission := FALSE;
  END CASE;
  
  RETURN v_has_permission;
END;
$$;


ALTER FUNCTION "public"."check_user_menu_permission"("p_user_id" "uuid", "p_menu_path" character varying, "p_permission" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_bugs_tables"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check and create bugs table
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bugs') THEN
        EXECUTE 'CREATE TABLE bugs (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL CHECK (severity IN (''critical'', ''high'', ''medium'', ''low'')),
            status TEXT NOT NULL DEFAULT ''open'' CHECK (status IN (''open'', ''in_progress'', ''resolved'', ''closed'')),
            assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            reporter_id UUID REFERENCES auth.users(id) NOT NULL,
            due_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );';

        -- Add indexes for performance
        EXECUTE 'CREATE INDEX idx_bugs_status ON bugs(status);';
        EXECUTE 'CREATE INDEX idx_bugs_severity ON bugs(severity);';
        EXECUTE 'CREATE INDEX idx_bugs_assignee ON bugs(assignee_id);';
    END IF;

    -- Check and create bug_comments table
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bug_comments') THEN
        EXECUTE 'CREATE TABLE bug_comments (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            bug_id BIGINT REFERENCES bugs(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );';
        
        EXECUTE 'CREATE INDEX idx_bug_comments_bug_id ON bug_comments(bug_id);';
    END IF;

    -- Check and create bug_attachments table
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bug_attachments') THEN
        EXECUTE 'CREATE TABLE bug_attachments (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            bug_id BIGINT REFERENCES bugs(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );';
        
        EXECUTE 'CREATE INDEX idx_bug_attachments_bug_id ON bug_attachments(bug_id);';
    END IF;

    -- Create triggers for updated_at
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_bugs_updated_at') THEN
        EXECUTE 'CREATE TRIGGER trigger_bugs_updated_at
        BEFORE UPDATE ON bugs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_bug_comments_updated_at') THEN
        EXECUTE 'CREATE TRIGGER trigger_bug_comments_updated_at
        BEFORE UPDATE ON bug_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();';
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_bugs_tables"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_clients_table"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Create clients table if it doesn't exist
  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    category VARCHAR(20) CHECK (category IN ('BUSINESS', 'INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'NON-PROFIT')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Create index on company_id for faster lookups
  CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
  
  -- Create index on client_code for faster lookups
  CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);
  
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS update_clients_updated_at_trigger ON clients;
  
  -- Create the trigger
  CREATE TRIGGER update_clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();
END;
$$;


ALTER FUNCTION "public"."create_clients_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event"("p_name" character varying, "p_is_active" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_event_id TEXT;
    result JSONB;
BEGIN
    -- Generate a unique event ID
    new_event_id := generate_event_id();
    
    -- Insert the new event
    INSERT INTO public.events (event_id, name, is_active)
    VALUES (new_event_id, p_name, p_is_active)
    RETURNING jsonb_build_object(
        'id', id,
        'event_id', event_id,
        'name', name,
        'is_active', is_active,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."create_event"("p_name" character varying, "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_hr_activities_table_if_not_exists"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'hr_activities'
  ) THEN
    -- Create the hr_activities table
    CREATE TABLE public.hr_activities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      related_entity TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB
    );
    
    -- Create indexes for better performance
    CREATE INDEX idx_hr_activities_activity_type ON public.hr_activities(activity_type);
    CREATE INDEX idx_hr_activities_related_entity ON public.hr_activities(related_entity);
    CREATE INDEX idx_hr_activities_entity_id ON public.hr_activities(entity_id);
    CREATE INDEX idx_hr_activities_timestamp ON public.hr_activities(timestamp);
  END IF;
END;
$$;


ALTER FUNCTION "public"."create_hr_activities_table_if_not_exists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_menu_tracking_table"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'menu_items_tracking'
  ) THEN
    -- Create the tracking table
    CREATE TABLE menu_items_tracking (
      id SERIAL PRIMARY KEY,
      menu_item_id INTEGER NOT NULL UNIQUE,
      last_known_state JSONB NOT NULL,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create an index for faster lookups
    CREATE INDEX idx_menu_items_tracking_menu_item_id ON menu_items_tracking(menu_item_id);
    
    RETURN TRUE;
  END IF;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."create_menu_tracking_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_system_logs_if_not_exists"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    CREATE TABLE system_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      resolved BOOLEAN DEFAULT FALSE
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."create_system_logs_if_not_exists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_id"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- This should return the current authenticated user's ID
    -- Implementation depends on your authentication system
    RETURN COALESCE(
        (current_setting('app.current_user_id', true))::INTEGER,
        1 -- Fallback to admin user for now
    );
END;
$$;


ALTER FUNCTION "public"."current_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- This should return the current user's role
    -- Implementation depends on your authentication system
    RETURN COALESCE(
        current_setting('app.current_user_role', true),
        'Administrator' -- Fallback for now
    );
END;
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_employee"("emp_id" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    employee_exists BOOLEAN;
BEGIN
    -- Check if the employee exists
    SELECT EXISTS (
        SELECT 1 FROM employees 
        WHERE id = emp_id
    ) INTO employee_exists;
    
    -- If employee doesn't exist, return false
    IF NOT employee_exists THEN
        RAISE NOTICE 'Employee with ID % does not exist', emp_id;
        RETURN false;
    END IF;

    -- Begin by deleting related records in a specific order to maintain referential integrity
    
    -- 1. Delete employee company associations first
    -- This is where the primary company check was happening
    DELETE FROM employee_companies WHERE employee_id = emp_id;
    
    -- 2. Update any leads assigned to this employee (set to NULL)
    UPDATE leads SET assigned_to = NULL WHERE assigned_to = emp_id;
    
    -- 3. Delete from other related tables (if they exist)
    -- These are examples - adjust based on your actual schema
    BEGIN
        DELETE FROM employee_assignments WHERE employee_id = emp_id;
        EXCEPTION WHEN undefined_table THEN
            -- Table doesn't exist, continue
            NULL;
    END;
    
    BEGIN
        DELETE FROM team_members WHERE employee_id = emp_id;
        EXCEPTION WHEN undefined_table THEN
            -- Table doesn't exist, continue
            NULL;
    END;
    
    BEGIN
        DELETE FROM employee_schedule WHERE employee_id = emp_id;
        EXCEPTION WHEN undefined_table THEN
            -- Table doesn't exist, continue
            NULL;
    END;
    
    BEGIN
        DELETE FROM employee_documents WHERE employee_id = emp_id;
        EXCEPTION WHEN undefined_table THEN
            -- Table doesn't exist, continue
            NULL;
    END;
    
    -- 4. Finally delete the employee record
    DELETE FROM employees WHERE id = emp_id;
    
    -- Return success
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."delete_employee"("emp_id" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_employee"("emp_id" integer) IS 'Safely deletes an employee and all associated records in related tables';



CREATE OR REPLACE FUNCTION "public"."delete_employee"("employee_id_param" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    employee_exists boolean;
    employee_record record;
BEGIN
    -- Check if the employee exists
    SELECT EXISTS (
        SELECT 1 FROM employees 
        WHERE id = employee_id_param
    ) INTO employee_exists;
    
    -- If employee doesn't exist, return false
    IF NOT employee_exists THEN
        RAISE NOTICE 'Employee with ID % does not exist', employee_id_param;
        RETURN false;
    END IF;
    
    -- Get employee record for audit purposes
    SELECT * INTO employee_record FROM employees WHERE id = employee_id_param;

    -- Delete related records in other tables
    -- These are example tables that might reference employees
    -- You should adjust this based on your actual schema

    -- Delete employee assignments
    DELETE FROM employee_assignments WHERE employee_id = employee_id_param;
    
    -- Update leads assigned to this employee (reassign to null)
    UPDATE leads SET assigned_to = NULL WHERE assigned_to = employee_id_param;
    
    -- Remove employee from teams or projects
    DELETE FROM team_members WHERE employee_id = employee_id_param;
    DELETE FROM project_assignments WHERE employee_id = employee_id_param;
    
    -- Delete employee calendar/events
    DELETE FROM employee_schedule WHERE employee_id = employee_id_param;
    
    -- Delete employee performance records
    DELETE FROM performance_reviews WHERE employee_id = employee_id_param;
    
    -- Delete employee contact information
    DELETE FROM employee_contacts WHERE employee_id = employee_id_param;
    
    -- Delete employee documents
    DELETE FROM employee_documents WHERE employee_id = employee_id_param;
    
    -- Delete employee notes
    DELETE FROM notes WHERE related_entity = 'employee' AND entity_id = employee_id_param::text;

    -- Delete employee company associations
    DELETE FROM employee_companies WHERE employee_id = employee_id_param;

    -- Delete any authorization/authentication related records
    DELETE FROM user_roles WHERE user_id = (
        SELECT user_id FROM employees WHERE id = employee_id_param
    );
    
    -- Finally delete the employee record
    DELETE FROM employees WHERE id = employee_id_param;
    
    -- Instead of relying on the trigger for audit, manually insert audit record
    -- This is safer as we have explicit control over the audit process
    BEGIN
        -- Only attempt to insert into audit_trail if the schema exists and we have permission
        -- This makes the function more robust
        INSERT INTO public.activities (
            action_type,
            entity_type,
            entity_id,
            entity_name,
            description
        ) VALUES (
            'DELETE',
            'employee',
            employee_id_param::text,
            employee_record.first_name || ' ' || employee_record.last_name,
            'Employee deleted through delete_employee function'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but continue with the deletion
        RAISE NOTICE 'Could not create audit record: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Employee with ID % and all related records have been deleted', employee_id_param;
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."delete_employee"("employee_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_employee"("employee_id_param" "uuid") IS 'Safely deletes an employee and all associated records in related tables';



CREATE OR REPLACE FUNCTION "public"."delete_event"("p_event_id" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    DELETE FROM public.events
    WHERE event_id = p_event_id
    RETURNING 1 INTO rows_affected;
    
    IF rows_affected IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."delete_event"("p_event_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_vendor_safely"("vendor_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Start a transaction
  BEGIN
    -- Check if the vendor exists
    IF NOT EXISTS (SELECT 1 FROM vendors WHERE id = vendor_id) THEN
      RAISE EXCEPTION 'Vendor with ID % does not exist', vendor_id;
    END IF;
    
    -- Delete the vendor record
    DELETE FROM vendors WHERE id = vendor_id;
    
    -- If we get here, the deletion was successful
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction on error
      ROLLBACK;
      RAISE; -- Re-throw the error
  END;
END;
$$;


ALTER FUNCTION "public"."delete_vendor_safely"("vendor_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_audit_triggers"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Set a session variable to indicate audit triggers should be disabled
    PERFORM set_config('app.disable_audit_triggers', 'true', false);
END;
$$;


ALTER FUNCTION "public"."disable_audit_triggers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_employee_triggers"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Disable the audit trigger
  ALTER TABLE public.employees DISABLE TRIGGER employee_audit_trigger;
  
  -- Keep other triggers enabled for data validation
  -- We only need to disable the audit trigger that's causing permission issues
END;
$$;


ALTER FUNCTION "public"."disable_employee_triggers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_audit_triggers"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Reset the session variable
    PERFORM set_config('app.disable_audit_triggers', 'false', false);
END;
$$;


ALTER FUNCTION "public"."enable_audit_triggers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_employee_triggers"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Re-enable the audit trigger
  ALTER TABLE public.employees ENABLE TRIGGER employee_audit_trigger;
END;
$$;


ALTER FUNCTION "public"."enable_employee_triggers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_admin_menu_permissions"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_admin_role_id INTEGER;
  v_menu_item RECORD;
  v_count INTEGER;
  v_total_items INTEGER := 0;
  v_updated_items INTEGER := 0;
  v_inserted_items INTEGER := 0;
BEGIN
  -- Get the Administrator role ID - only using title or id
  SELECT id INTO v_admin_role_id 
  FROM roles 
  WHERE title = 'Administrator' OR id = 1
  LIMIT 1;
  
  -- If no admin role found, return false
  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Administrator role not found';
    RETURN FALSE;
  END IF;
  
  -- Make sure all menu items are visible
  UPDATE menu_items SET is_visible = TRUE;
  
  -- Count total menu items
  SELECT COUNT(*) INTO v_total_items FROM menu_items;
  
  -- Loop through all menu items
  FOR v_menu_item IN SELECT id FROM menu_items
  LOOP
    -- Check if permission already exists
    SELECT COUNT(*) INTO v_count
    FROM role_menu_permissions
    WHERE role_id = v_admin_role_id AND menu_item_id = v_menu_item.id;
    
    -- If permission doesn't exist, create it
    IF v_count = 0 THEN
      INSERT INTO role_menu_permissions (
        role_id,
        menu_item_id,
        can_view,
        can_add,
        can_edit,
        can_delete
      ) VALUES (
        v_admin_role_id,
        v_menu_item.id,
        TRUE,
        TRUE,
        TRUE,
        TRUE
      );
      v_inserted_items := v_inserted_items + 1;
    ELSE
      -- Update existing permission to ensure all are enabled
      UPDATE role_menu_permissions
      SET 
        can_view = TRUE,
        can_add = TRUE,
        can_edit = TRUE,
        can_delete = TRUE
      WHERE 
        role_id = v_admin_role_id AND 
        menu_item_id = v_menu_item.id;
      v_updated_items := v_updated_items + 1;
    END IF;
  END LOOP;
  
  -- Log the results
  RAISE NOTICE 'Admin menu permissions updated: Total items: %, Inserted: %, Updated: %', 
    v_total_items, v_inserted_items, v_updated_items;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."ensure_admin_menu_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_menu_tracking_table"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'menu_items_tracking'
  ) THEN
    -- Create the tracking table
    CREATE TABLE menu_items_tracking (
      id SERIAL PRIMARY KEY,
      menu_item_id INTEGER NOT NULL UNIQUE,
      last_known_state JSONB NOT NULL,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create an index for faster lookups
    CREATE INDEX idx_menu_items_tracking_menu_item_id ON menu_items_tracking(menu_item_id);
    
    RETURN TRUE;
  END IF;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."ensure_menu_tracking_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_rejection_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only run if status is REJECTED
    IF NEW.status = 'REJECTED' THEN
        -- Set rejection_reason if null
        IF NEW.rejection_reason IS NULL THEN
            NEW.rejection_reason := 'No reason provided (auto-filled by trigger)';
        END IF;
        
        -- Set rejected_at if null
        IF NEW.rejected_at IS NULL THEN
            NEW.rejected_at := NOW();
        END IF;
        
        -- Log a warning if rejected_by is null
        IF NEW.rejected_by IS NULL THEN
            RAISE WARNING 'Lead % marked as REJECTED but rejected_by is NULL', NEW.id;
        END IF;
        
        -- Log a warning if rejected_by_employee_id is null
        IF NEW.rejected_by_employee_id IS NULL THEN
            RAISE WARNING 'Lead % marked as REJECTED but rejected_by_employee_id is NULL', NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_rejection_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_sql"("sql_statement" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE sql_statement;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error executing SQL: %', SQLERRM;
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."execute_sql"("sql_statement" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_old_insights"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE predictive_insights 
    SET 
        status = 'expired',
        updated_at = now()
    WHERE expires_at < now() 
    AND status != 'expired';
END;
$$;


ALTER FUNCTION "public"."expire_old_insights"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_event_id"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_id TEXT;
    existing_count INTEGER;
BEGIN
    LOOP
        -- Generate a random ID with EVT- prefix followed by 8 alphanumeric characters
        new_id := 'EVT-' || substr(md5(random()::text), 1, 8);
        
        -- Check if this ID already exists
        SELECT COUNT(*) INTO existing_count FROM public.events WHERE event_id = new_id;
        
        -- If the ID is unique, return it
        IF existing_count = 0 THEN
            RETURN new_id;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_event_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ai_system_configuration"() RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  config_result JSON;
BEGIN
  SELECT json_object_agg(config_key, config_value) INTO config_result
  FROM ai_configurations 
  WHERE is_active = true;
  
  RETURN config_result;
END;
$$;


ALTER FUNCTION "public"."get_ai_system_configuration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_best_sales_user_for_lead"() RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Select the user with the sales role who has the fewest active leads assigned
    SELECT u.id INTO v_user_id
    FROM users u
    LEFT JOIN (
        SELECT assigned_to, COUNT(*) as lead_count
        FROM leads
        WHERE status IN ('assigned', 'in_progress', 'contacted')
        GROUP BY assigned_to
    ) l ON u.id = l.assigned_to
    WHERE u.role = 'sales'
    ORDER BY COALESCE(l.lead_count, 0) ASC, u.last_sign_in_at DESC
    LIMIT 1;
    
    -- If no sales users found, return NULL
    IF v_user_id IS NULL THEN
        RAISE WARNING 'No sales users found for automatic assignment';
    END IF;
    
    RETURN v_user_id;
END;
$$;


ALTER FUNCTION "public"."get_best_sales_user_for_lead"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_complete_menu_hierarchy"("p_user_id" "text") RETURNS TABLE("id" integer, "parent_id" integer, "name" "text", "path" "text", "icon" "text", "is_visible" boolean, "sort_order" integer, "can_view" boolean, "can_add" boolean, "can_edit" boolean, "can_delete" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_role_id INTEGER;
  v_is_admin BOOLEAN := FALSE;
  v_user_found BOOLEAN := FALSE;
BEGIN
  -- Log the input parameter for debugging
  RAISE NOTICE 'get_complete_menu_hierarchy called with p_user_id: %', p_user_id;
  
  -- First try to get the user directly
  BEGIN
    SELECT role_id INTO v_role_id 
    FROM user_accounts 
    WHERE id::TEXT = p_user_id;
    
    IF FOUND THEN
      v_user_found := TRUE;
      RAISE NOTICE 'User found with ID: %, role_id: %', p_user_id, v_role_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error finding user by ID: %', SQLERRM;
  END;
  
  -- If user not found, try other methods
  IF NOT v_user_found THEN
    BEGIN
      -- Try to find by employee_id
      SELECT ua.role_id INTO v_role_id 
      FROM user_accounts ua
      JOIN employees e ON ua.employee_id = e.id
      WHERE e.id::TEXT = p_user_id;
      
      IF FOUND THEN
        v_user_found := TRUE;
        RAISE NOTICE 'User found by employee_id: %, role_id: %', p_user_id, v_role_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error finding user by employee_id: %', SQLERRM;
    END;
  END IF;
  
  -- If still not found, check if p_user_id is '1' which indicates admin
  IF NOT v_user_found AND (p_user_id = '1' OR p_user_id = 1) THEN
    v_is_admin := TRUE;
    RAISE NOTICE 'Admin access granted based on p_user_id = 1';
  ELSIF v_role_id IS NOT NULL THEN
    -- Check if the role is Administrator
    SELECT EXISTS (
      SELECT 1 FROM roles 
      WHERE id = v_role_id AND (title = 'Administrator' OR id = 1)
    ) INTO v_is_admin;
    
    RAISE NOTICE 'Checked if role is admin: %, result: %', v_role_id, v_is_admin;
  END IF;
  
  -- If we still don't have a determination, default to showing admin view
  -- This ensures the menu is visible in case of errors
  IF NOT v_user_found AND NOT v_is_admin THEN
    RAISE WARNING 'User not found and not admin, defaulting to showing all menu items';
    v_is_admin := TRUE;
  END IF;
  
  -- Handle administrator role specially to ensure they see EVERYTHING
  IF v_is_admin THEN
    RAISE NOTICE 'Returning all menu items with full permissions for admin';
    
    -- Administrator role - show all menu items with full permissions
    RETURN QUERY
    SELECT 
      mi.id,
      mi.parent_id,
      mi.name,
      mi.path,
      mi.icon,
      COALESCE(mi.is_visible, TRUE), -- Default to visible if NULL
      COALESCE(mi.sort_order, 0),    -- Default to 0 if NULL
      TRUE as can_view,  -- Administrators always have all permissions
      TRUE as can_add,
      TRUE as can_edit,
      TRUE as can_delete
    FROM 
      menu_items mi
    ORDER BY 
      mi.parent_id NULLS FIRST, COALESCE(mi.sort_order, 0);
  ELSE
    RAISE NOTICE 'Returning menu items with permissions for role_id: %', v_role_id;
    
    -- For non-administrators, use regular permissions
    RETURN QUERY
    SELECT 
      mi.id,
      mi.parent_id,
      mi.name,
      mi.path,
      mi.icon,
      COALESCE(mi.is_visible, TRUE), -- Default to visible if NULL
      COALESCE(mi.sort_order, 0),    -- Default to 0 if NULL
      COALESCE(rmp.can_view, FALSE),
      COALESCE(rmp.can_add, FALSE),
      COALESCE(rmp.can_edit, FALSE),
      COALESCE(rmp.can_delete, FALSE)
    FROM 
      menu_items mi
    LEFT JOIN 
      role_menu_permissions rmp ON mi.id = rmp.menu_item_id AND rmp.role_id = v_role_id
    WHERE
      COALESCE(mi.is_visible, TRUE) = TRUE AND COALESCE(rmp.can_view, FALSE) = TRUE
    ORDER BY 
      mi.parent_id NULLS FIRST, COALESCE(mi.sort_order, 0);
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_complete_menu_hierarchy"("p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_comprehensive_employee_data"() RETURNS SETOF "json"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', e.id,
      'employee_id', e.employee_id,
      'first_name', e.first_name,
      'last_name', e.last_name,
      'email', e.email,
      'phone', e.phone,
      'job_title', e.job_title,
      'hire_date', e.hire_date,
      'status', e.status,
      'notes', e.notes,
      'created_at', e.created_at,
      'updated_at', e.updated_at,
      
      'department_id', d.id,
      'department_name', d.name,
      
      'designation_id', des.id,
      'designation_title', des.name,
      
      'branch_id', b.id,
      'branch_name', b.name,
      'branch_location', b.location,
      
      'primary_company_name', (
        SELECT c.name
        FROM employee_companies ec
        JOIN companies c ON ec.company_id = c.id
        WHERE ec.employee_id = e.id AND ec.is_primary = true
        LIMIT 1
      ),
      
      'company_associations', (
        SELECT 
          json_agg(
            json_build_object(
              'id', ec.id,
              'company_id', ec.company_id,
              'company_name', c.name,
              'is_primary', ec.is_primary,
              'role_title', ec.role_title,
              'responsibilities', ec.responsibilities,
              'start_date', ec.start_date,
              'end_date', ec.end_date,
              'percentage', ec.percentage
            )
          )
        FROM employee_companies ec
        JOIN companies c ON ec.company_id = c.id
        WHERE ec.employee_id = e.id
      )
    )
  FROM 
    employees e
  LEFT JOIN 
    departments d ON e.department_id = d.id
  LEFT JOIN 
    designations des ON e.designation_id = des.id
  LEFT JOIN 
    branches b ON e.branch_id = b.id
  ORDER BY 
    e.first_name, e.last_name;
END;
$$;


ALTER FUNCTION "public"."get_comprehensive_employee_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversion_rates_by_source"("start_date" "date" DEFAULT NULL::"date", "end_date" "date" DEFAULT NULL::"date", "source_ids" integer[] DEFAULT '{}'::integer[]) RETURNS TABLE("source_id" integer, "source_name" "text", "total_leads" bigint, "won_leads" bigint, "lost_leads" bigint, "conversion_rate" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ls.id AS source_id,
        ls.name AS source_name,
        COUNT(l.id) AS total_leads,
        COUNT(CASE WHEN l.status = 'WON' THEN 1 END) AS won_leads,
        COUNT(CASE WHEN l.status = 'LOST' THEN 1 END) AS lost_leads,
        CASE 
            WHEN COUNT(l.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN l.status = 'WON' THEN 1 END)::NUMERIC / COUNT(l.id)) * 100, 2)
            ELSE 0
        END AS conversion_rate
    FROM 
        lead_sources ls
    LEFT JOIN 
        leads l ON ls.id = l.lead_source_id
    WHERE 
        (start_date IS NULL OR l.created_at >= start_date) AND
        (end_date IS NULL OR l.created_at <= end_date) AND
        (array_length(source_ids, 1) IS NULL OR ls.id = ANY(source_ids))
    GROUP BY 
        ls.id, ls.name
    ORDER BY 
        ls.name;
END;
$$;


ALTER FUNCTION "public"."get_conversion_rates_by_source"("start_date" "date", "end_date" "date", "source_ids" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_employee_by_id"("employee_id" integer) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  employee_record json;
BEGIN
  SELECT row_to_json(e)
  INTO employee_record
  FROM employees e
  WHERE e.id = employee_id;
  
  RETURN employee_record;
END;
$$;


ALTER FUNCTION "public"."get_employee_by_id"("employee_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_employee_department_counts"() RETURNS TABLE("department_name" "text", "employee_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Return counts for employees with departments
  RETURN QUERY
  SELECT 
    d.name AS department_name,
    COUNT(e.id)::BIGINT AS employee_count
  FROM 
    departments d
  LEFT JOIN 
    employees e ON e.department_id = d.id
  GROUP BY 
    d.name
  
  UNION ALL
  
  -- Return count for employees with no department
  SELECT 
    'No Department' AS department_name,
    COUNT(e.id)::BIGINT AS employee_count
  FROM 
    employees e
  WHERE 
    e.department_id IS NULL;
END;
$$;


ALTER FUNCTION "public"."get_employee_department_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_by_id"("p_event_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'event_id', event_id,
        'name', name,
        'is_active', is_active,
        'created_at', created_at,
        'updated_at', updated_at
    )
    INTO result
    FROM public.events
    WHERE event_id = p_event_id;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Event with ID % not found', p_event_id;
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_event_by_id"("p_event_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_events"("p_is_active" boolean DEFAULT NULL::boolean, "p_search" "text" DEFAULT NULL::"text") RETURNS SETOF "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', e.id,
        'event_id', e.event_id,
        'name', e.name,
        'is_active', e.is_active,
        'created_at', e.created_at,
        'updated_at', e.updated_at
    )
    FROM public.events e
    WHERE (p_is_active IS NULL OR e.is_active = p_is_active)
    AND (p_search IS NULL OR 
         e.name ILIKE '%' || p_search || '%' OR 
         e.event_id ILIKE '%' || p_search || '%')
    ORDER BY e.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_events"("p_is_active" boolean, "p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lead_trends_by_date"("start_date" "date" DEFAULT NULL::"date", "end_date" "date" DEFAULT NULL::"date", "source_ids" integer[] DEFAULT '{}'::integer[], "employee_ids" integer[] DEFAULT '{}'::integer[], "status_list" "text"[] DEFAULT '{}'::"text"[]) RETURNS TABLE("date_group" "date", "total_leads" bigint, "new_leads" bigint, "contacted_leads" bigint, "qualified_leads" bigint, "proposal_leads" bigint, "won_leads" bigint, "lost_leads" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT 
            generate_series(
                COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days')::DATE,
                COALESCE(end_date, CURRENT_DATE)::DATE,
                '1 day'::INTERVAL
            )::DATE AS date_group
    ),
    filtered_leads AS (
        SELECT 
            DATE(created_at) AS lead_date,
            status
        FROM 
            leads
        WHERE 
            (start_date IS NULL OR created_at >= start_date) AND
            (end_date IS NULL OR created_at <= end_date) AND
            (array_length(source_ids, 1) IS NULL OR lead_source_id = ANY(source_ids)) AND
            (array_length(employee_ids, 1) IS NULL OR assigned_to = ANY(employee_ids)) AND
            (array_length(status_list, 1) IS NULL OR status = ANY(status_list))
    )
    SELECT 
        ds.date_group,
        COUNT(fl.lead_date) AS total_leads,
        COUNT(CASE WHEN fl.status = 'NEW' THEN 1 END) AS new_leads,
        COUNT(CASE WHEN fl.status = 'CONTACTED' THEN 1 END) AS contacted_leads,
        COUNT(CASE WHEN fl.status = 'QUALIFIED' THEN 1 END) AS qualified_leads,
        COUNT(CASE WHEN fl.status = 'PROPOSAL' THEN 1 END) AS proposal_leads,
        COUNT(CASE WHEN fl.status = 'WON' THEN 1 END) AS won_leads,
        COUNT(CASE WHEN fl.status = 'LOST' THEN 1 END) AS lost_leads
    FROM 
        date_series ds
    LEFT JOIN 
        filtered_leads fl ON ds.date_group = fl.lead_date
    GROUP BY 
        ds.date_group
    ORDER BY 
        ds.date_group;
END;
$$;


ALTER FUNCTION "public"."get_lead_trends_by_date"("start_date" "date", "end_date" "date", "source_ids" integer[], "employee_ids" integer[], "status_list" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lowercase_anomalies"() RETURNS TABLE("id" integer, "branch_name" "text", "company_name" "text", "anomaly_type" "text", "field_value" "text", "uppercase_value" "text", "anomaly_type_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH field_checks AS (
    SELECT 'branches' AS table_name, 'name' AS field_name, 'Branch name' AS field_description UNION ALL
    SELECT 'branches', 'company_name', 'Company name' UNION ALL
    SELECT 'branches', 'code', 'Branch code' UNION ALL
    SELECT 'branches', 'manager', 'Manager name' UNION ALL
    SELECT 'branches', 'status', 'Status' UNION ALL
    SELECT 'branches', 'address', 'Address'
  ),
  lowercase_anomalies AS (
    SELECT
      b.id,
      b.name AS branch_name,
      b.company_name,
      fc.field_description || ' contains lowercase' AS anomaly_type,
      CASE
        WHEN fc.field_name = 'name' THEN b.name
        WHEN fc.field_name = 'company_name' THEN b.company_name
        WHEN fc.field_name = 'code' THEN b.code
        WHEN fc.field_name = 'manager' THEN b.manager
        WHEN fc.field_name = 'status' THEN b.status
        WHEN fc.field_name = 'address' THEN b.address
      END AS field_value,
      CASE
        WHEN fc.field_name = 'name' THEN UPPER(b.name)
        WHEN fc.field_name = 'company_name' THEN UPPER(b.company_name)
        WHEN fc.field_name = 'code' THEN UPPER(b.code)
        WHEN fc.field_name = 'manager' THEN UPPER(b.manager)
        WHEN fc.field_name = 'status' THEN UPPER(b.status)
        WHEN fc.field_name = 'address' THEN UPPER(b.address)
      END AS uppercase_value
    FROM
      branches b
    CROSS JOIN
      field_checks fc
    WHERE
      fc.table_name = 'branches'
      AND CASE
        WHEN fc.field_name = 'name' THEN b.name IS NOT NULL AND b.name <> UPPER(b.name)
        WHEN fc.field_name = 'company_name' THEN b.company_name IS NOT NULL AND b.company_name <> UPPER(b.company_name)
        WHEN fc.field_name = 'code' THEN b.code IS NOT NULL AND b.code <> UPPER(b.code)
        WHEN fc.field_name = 'manager' THEN b.manager IS NOT NULL AND b.manager <> UPPER(b.manager)
        WHEN fc.field_name = 'status' THEN b.status IS NOT NULL AND b.status <> UPPER(b.status)
        WHEN fc.field_name = 'address' THEN b.address IS NOT NULL AND b.address <> UPPER(b.address)
        ELSE FALSE
      END
  )
  SELECT
    id,
    branch_name,
    company_name,
    anomaly_type,
    field_value,
    uppercase_value,
    COUNT(*) OVER (PARTITION BY anomaly_type) AS anomaly_type_count
  FROM
    lowercase_anomalies
  ORDER BY
    anomaly_type_count DESC,
    anomaly_type,
    company_name,
    branch_name;
END;
$$;


ALTER FUNCTION "public"."get_lowercase_anomalies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_rejected_leads_with_details"() RETURNS TABLE("id" integer, "lead_number" "text", "client_name" "text", "status" "text", "company_name" "text", "branch_name" "text", "rejection_details" "text", "rejection_timestamp" timestamp with time zone, "rejection_user" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.lead_number,
        v.client_name,
        v.status,
        v.company_name,
        v.branch_name,
        v.rejection_details,
        v.rejection_timestamp,
        v.rejection_user
    FROM rejected_leads_view v
    ORDER BY v.rejection_timestamp DESC;
END;
$$;


ALTER FUNCTION "public"."get_rejected_leads_with_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sales_employees_for_lead"("lead_company_id" integer, "lead_location" character varying) RETURNS TABLE("id" integer, "employee_id" character varying, "first_name" character varying, "last_name" character varying, "status" character varying, "company_id" integer, "branch_id" integer, "department_id" integer, "role" character varying, "job_title" character varying, "department" character varying, "location" character varying, "match_score" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Return employees who match the company directly OR through the junction table
  RETURN QUERY
  WITH unique_employees AS (
    SELECT DISTINCT ON (e.id) 
      e.id,
      e.employee_id,
      e.first_name,
      e.last_name,
      e.status,
      e.company_id,
      e.branch_id,
      e.department_id,
      e.role,
      e.job_title,
      e.department,
      e.location,
      -- Calculate match score for sorting (lower is better)
      CASE 
        -- Exact location match (highest priority)
        WHEN LOWER(e.location) = LOWER(lead_location) THEN 1
        -- Branch location matches lead location
        WHEN LOWER(b.location) = LOWER(lead_location) THEN 2
        -- Location contains the lead location as substring
        WHEN LOWER(e.location) LIKE '%' || LOWER(lead_location) || '%' THEN 3
        -- Branch location contains lead location as substring
        WHEN LOWER(b.location) LIKE '%' || LOWER(lead_location) || '%' THEN 4
        -- No location match
        ELSE 5
      END AS match_score
    FROM employees e
    LEFT JOIN employee_companies ec ON e.id = ec.employee_id
    LEFT JOIN branches b ON e.branch_id = b.id
    WHERE 
      e.status = 'active'
      AND (
        -- Match by direct company_id
        e.company_id = lead_company_id
        OR
        -- Match by junction table
        (ec.company_id = lead_company_id AND ec.percentage > 0)
      )
      AND (
        -- Match sales-related roles
        e.job_title ILIKE '%sales%'
        OR e.role ILIKE '%sales%'
        OR e.department ILIKE '%sales%'
        OR e.job_title ILIKE '%account manager%'
        OR e.role ILIKE '%account manager%'
        OR e.job_title ILIKE '%business development%'
        OR e.role ILIKE '%business development%'
      )
      -- Exclude executive roles
      AND NOT (
        e.role ILIKE '%ceo%'
        OR e.role ILIKE '%cto%'
        OR e.role ILIKE '%cfo%'
        OR e.role ILIKE '%coo%'
        OR e.role ILIKE '%president%'
        OR e.role ILIKE '%vice president%'
        OR e.role ILIKE '%vp%'
        OR e.role ILIKE '%chief%'
        OR e.role ILIKE '%director%'
        OR e.role ILIKE '%head of%'
        OR e.role ILIKE '%founder%'
        OR e.role ILIKE '%owner%'
        OR e.job_title ILIKE '%ceo%'
        OR e.job_title ILIKE '%cto%'
        OR e.job_title ILIKE '%cfo%'
        OR e.job_title ILIKE '%coo%'
        OR e.job_title ILIKE '%president%'
        OR e.job_title ILIKE '%vice president%'
        OR e.job_title ILIKE '%vp%'
        OR e.job_title ILIKE '%chief%'
        OR e.job_title ILIKE '%director%'
        OR e.job_title ILIKE '%head of%'
        OR e.job_title ILIKE '%founder%'
        OR e.job_title ILIKE '%owner%'
      )
  )
  SELECT 
    ue.id,
    ue.employee_id,
    ue.first_name,
    ue.last_name,
    ue.status,
    ue.company_id,
    ue.branch_id,
    ue.department_id,
    ue.role,
    ue.job_title,
    ue.department,
    ue.location,
    ue.match_score
  FROM unique_employees ue
  ORDER BY ue.match_score, ue.first_name;
END;
$$;


ALTER FUNCTION "public"."get_sales_employees_for_lead"("lead_company_id" integer, "lead_location" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_columns"("table_name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  columns text[];
BEGIN
  SELECT array_agg(column_name::text)
  INTO columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = $1;
  
  RETURN columns;
END;
$_$;


ALTER FUNCTION "public"."get_table_columns"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_performance_metrics"("start_date" "date" DEFAULT NULL::"date", "end_date" "date" DEFAULT NULL::"date", "employee_ids" integer[] DEFAULT '{}'::integer[]) RETURNS TABLE("employee_id" integer, "employee_name" "text", "total_leads" bigint, "won_leads" bigint, "lost_leads" bigint, "conversion_rate" numeric, "avg_days_to_close" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id AS employee_id,
        e.first_name || ' ' || e.last_name AS employee_name,
        COUNT(l.id) AS total_leads,
        COUNT(CASE WHEN l.status = 'WON' THEN 1 END) AS won_leads,
        COUNT(CASE WHEN l.status = 'LOST' THEN 1 END) AS lost_leads,
        CASE 
            WHEN COUNT(l.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN l.status = 'WON' THEN 1 END)::NUMERIC / COUNT(l.id)) * 100, 2)
            ELSE 0
        END AS conversion_rate,
        ROUND(AVG(
            CASE 
                WHEN l.status IN ('WON', 'LOST') THEN 
                    EXTRACT(EPOCH FROM (l.updated_at - l.created_at)) / 86400
                ELSE NULL
            END
        ), 1) AS avg_days_to_close
    FROM 
        employees e
    LEFT JOIN 
        leads l ON e.id = l.assigned_to
    WHERE 
        (start_date IS NULL OR l.created_at >= start_date) AND
        (end_date IS NULL OR l.created_at <= end_date) AND
        (array_length(employee_ids, 1) IS NULL OR e.id = ANY(employee_ids))
    GROUP BY 
        e.id, e.first_name, e.last_name
    ORDER BY 
        e.first_name, e.last_name;
END;
$$;


ALTER FUNCTION "public"."get_team_performance_metrics"("start_date" "date", "end_date" "date", "employee_ids" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_menu_permissions"("p_user_id" "uuid") RETURNS TABLE("menu_item_id" integer, "menu_name" character varying, "menu_path" character varying, "parent_id" integer, "icon" character varying, "is_visible" boolean, "can_view" boolean, "can_add" boolean, "can_edit" boolean, "can_delete" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ump.menu_item_id,
    ump.menu_name,
    ump.menu_path,
    ump.parent_id,
    ump.icon,
    ump.is_visible,
    ump.can_view,
    ump.can_add,
    ump.can_edit,
    ump.can_delete
  FROM 
    user_menu_permissions ump
  WHERE 
    ump.user_id = p_user_id
  ORDER BY 
    ump.parent_id NULLS FIRST, 
    ump.menu_name;
END;
$$;


ALTER FUNCTION "public"."get_user_menu_permissions"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_by_role"("p_role_id" integer) RETURNS TABLE("id" integer, "username" "text", "email" "text", "name" "text", "role_name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.username,
    ua.email,
    CONCAT(e.first_name, ' ', e.last_name) AS name,
    r.title AS role_name
  FROM 
    public.user_accounts ua
  JOIN 
    public.employees e ON ua.employee_id = e.id
  JOIN 
    public.roles r ON ua.role_id = r.id
  WHERE 
    ua.role_id = p_role_id
    AND ua.is_active = true;
END;
$$;


ALTER FUNCTION "public"."get_users_by_role"("p_role_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_lead_reallocation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  affected_rows INTEGER;
  valid_statuses TEXT[] := ARRAY['inactive', 'terminated', 'on leave'];
  normalized_old_status TEXT;
  normalized_new_status TEXT;
BEGIN
  -- Normalize status values by trimming spaces, converting to lowercase
  normalized_old_status := LOWER(TRIM(OLD.status));
  normalized_new_status := LOWER(TRIM(NEW.status));
  
  -- Log all status changes for debugging
  RAISE NOTICE 'Employee ID: %, Name: % %, Old Status: %, New Status: %', 
    NEW.id, 
    NEW.first_name, 
    NEW.last_name, 
    normalized_old_status, 
    normalized_new_status;

  -- Check if this is a status change we should handle
  IF (TG_OP = 'UPDATE' AND 
      normalized_old_status = 'active' AND 
      normalized_new_status = ANY(valid_statuses)) THEN
    
    RAISE NOTICE 'Processing lead reassignment for employee % (% %)', 
      NEW.id, NEW.first_name, NEW.last_name;

    -- First, check if employee has any assigned leads
    WITH lead_count AS (
      SELECT COUNT(*) as total
      FROM leads
      WHERE assigned_to = NEW.id
      AND status NOT IN ('WON', 'LOST', 'REJECTED')
    )
    SELECT total INTO affected_rows FROM lead_count;

    RAISE NOTICE 'Found % leads to reassign', affected_rows;

    -- Only proceed if there are leads to reassign
    IF affected_rows > 0 THEN
      -- Update all assigned leads to UNASSIGNED status
      WITH updated_leads AS (
        UPDATE leads
        SET 
          status = 'UNASSIGNED',
          assigned_to = NULL,
          updated_at = CURRENT_TIMESTAMP,
          reassigned_by = NEW.id,
          is_reassigned = true,
          reassigned_at = CURRENT_TIMESTAMP,
          reassigned_from_company_id = (
            SELECT company_id 
            FROM employee_companies 
            WHERE employee_id = NEW.id 
            AND is_primary = true
            LIMIT 1
          ),
          reassigned_from_branch_id = (
            SELECT branch_id 
            FROM employee_companies 
            WHERE employee_id = NEW.id 
            AND is_primary = true
            LIMIT 1
          )
        WHERE 
          assigned_to = NEW.id
          AND status NOT IN ('WON', 'LOST', 'REJECTED')
        RETURNING id, lead_number
      )
      SELECT COUNT(*) INTO affected_rows FROM updated_leads;

      RAISE NOTICE 'Successfully reassigned % leads', affected_rows;

      -- Log the reallocation in activity_log if it exists
      IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'activity_log'
      ) THEN
        INSERT INTO activity_log (
          activity_type,
          entity_type,
          entity_id,
          description,
          created_at
        )
        SELECT 
          'lead_reallocation',
          'lead',
          id::text,
          format(
            'Lead %s automatically unassigned due to employee %s %s status change to %s',
            lead_number,
            NEW.first_name,
            NEW.last_name,
            NEW.status
          ),
          CURRENT_TIMESTAMP
        FROM leads
        WHERE assigned_to = NEW.id
        AND status NOT IN ('WON', 'LOST', 'REJECTED');

        RAISE NOTICE 'Activity log entries created';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Status change does not require lead reassignment (Old: %, New: %)',
      normalized_old_status, normalized_new_status;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_lead_reallocation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_employee_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if audit triggers should be skipped
  IF should_skip_audit_trigger() THEN
    RETURN NULL;
  END IF;

  -- Continue with normal audit logging
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_security.audit_trail (
      entity_type, 
      entity_id, 
      action, 
      new_values, 
      old_values, 
      user_id, 
      timestamp
    ) VALUES (
      'employees',
      NEW.id::text,
      'INSERT',
      row_to_json(NEW),
      NULL,
      current_setting('app.current_user_id', true)::uuid,
      now()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_security.audit_trail (
      entity_type, 
      entity_id, 
      action, 
      new_values, 
      old_values, 
      user_id, 
      timestamp
    ) VALUES (
      'employees',
      NEW.id::text,
      'UPDATE',
      row_to_json(NEW),
      row_to_json(OLD),
      current_setting('app.current_user_id', true)::uuid,
      now()
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_security.audit_trail (
      entity_type, 
      entity_id, 
      action, 
      new_values, 
      old_values, 
      user_id, 
      timestamp
    ) VALUES (
      'employees',
      OLD.id::text,
      'DELETE',
      NULL,
      row_to_json(OLD),
      current_setting('app.current_user_id', true)::uuid,
      now()
    );
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."log_employee_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_performance_metric"("metric_name" "text", "metric_value" numeric, "metric_unit" "text" DEFAULT 'ms'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO system_logs (action, details) 
    VALUES ('performance_metric', 
            jsonb_build_object(
                'metric', metric_name,
                'value', metric_value,
                'unit', metric_unit
            ));
END;
$$;


ALTER FUNCTION "public"."log_performance_metric"("metric_name" "text", "metric_value" numeric, "metric_unit" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_slow_queries"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF current_setting('statement_timeout')::integer > 1000 THEN
        INSERT INTO query_logs (query_text, execution_time)
        VALUES (current_query(), extract(epoch from now() - clock_timestamp()));
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."log_slow_queries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_task_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_status_history (
      task_id,
      from_status,
      to_status,
      changed_at,
      changed_by,
      notes,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NOW(),
      COALESCE(NEW.metadata->>'last_updated_by', 'system'),
      NEW.metadata->>'completion_notes',
      jsonb_build_object(
        'task_number', NEW.task_number,
        'lead_id', NEW.lead_id,
        'estimated_hours', NEW.estimated_hours,
        'actual_hours', NEW.actual_hours,
        'due_date', NEW.due_date,
        'completed_at', NEW.completed_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_task_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_view_performance"("p_view_name" "text", "p_rows_returned" integer, "p_execution_time_ms" double precision) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO query_performance_logs (view_name, rows_returned, execution_time_ms)
    VALUES (p_view_name, p_rows_returned, p_execution_time_ms);
END;
$$;


ALTER FUNCTION "public"."log_view_performance"("p_view_name" "text", "p_rows_returned" integer, "p_execution_time_ms" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_location"("loc" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Convert to lowercase, trim whitespace, and capitalize first letter of each word
  RETURN INITCAP(TRIM(LOWER(loc)));
END;
$$;


ALTER FUNCTION "public"."normalize_location"("loc" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_location_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.location IS NOT NULL THEN
      NEW.location = normalize_location(NEW.location);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."normalize_location_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admins_of_lead_reassignment"("employee_id" integer, "employee_name" "text", "new_status" "text", "affected_leads_count" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_admins_of_lead_reassignment"("employee_id" integer, "employee_name" "text", "new_status" "text", "affected_leads_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_user_roles_fast"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_roles_fast;
END;
$$;


ALTER FUNCTION "public"."refresh_user_roles_fast"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_employee"("emp_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Use a transaction to ensure all operations succeed or fail together
    BEGIN
        -- First delete from employee_companies to avoid foreign key constraints
        DELETE FROM employee_companies WHERE employee_id = emp_id;
        
        -- Delete any leads assigned to this employee
        UPDATE leads SET assigned_to = NULL WHERE assigned_to = emp_id;
        
        -- Delete any activities related to this employee
        DELETE FROM activities WHERE employee_id = emp_id;
        
        -- Finally delete the employee record
        DELETE FROM employees WHERE id = emp_id;
        
        -- If we get here, all operations succeeded
    EXCEPTION WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE EXCEPTION 'Failed to remove employee: %', SQLERRM;
    END;
END;
$$;


ALTER FUNCTION "public"."remove_employee"("emp_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_employee_v2"("emp_id" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    trigger_setting TEXT;
BEGIN
    -- Save current trigger setting
    SELECT current_setting('session_replication_role') INTO trigger_setting;
    
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';
    
    BEGIN
        -- Delete employee company associations first
        DELETE FROM employee_companies WHERE employee_id = emp_id;
        
        -- Then delete the employee
        DELETE FROM employees WHERE id = emp_id;
        
        -- Restore original trigger setting
        EXECUTE 'SET session_replication_role = ' || quote_literal(trigger_setting);
    EXCEPTION
        WHEN OTHERS THEN
            -- Ensure triggers are re-enabled even if an error occurs
            EXECUTE 'SET session_replication_role = ' || quote_literal(trigger_setting);
            RAISE;
    END;
END;
$$;


ALTER FUNCTION "public"."remove_employee_v2"("emp_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_employee_v3"("emp_id" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    company_count INTEGER;
BEGIN
    -- Use a transaction to ensure atomicity
    BEGIN
        -- Check if the employee has any company associations
        SELECT COUNT(*) INTO company_count FROM employee_companies WHERE employee_id = emp_id;
        
        -- If the employee has company associations, delete them first
        IF company_count > 0 THEN
            -- Disable triggers temporarily to bypass validation
            SET LOCAL session_replication_role = 'replica';
            
            -- Delete employee company associations
            DELETE FROM employee_companies WHERE employee_id = emp_id;
            
            -- Re-enable triggers
            SET LOCAL session_replication_role = 'origin';
        END IF;
        
        -- Then delete the employee
        DELETE FROM employees WHERE id = emp_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- Re-enable triggers if an exception occurs
            SET LOCAL session_replication_role = 'origin';
            -- Re-raise the exception
            RAISE;
    END;
END;
$$;


ALTER FUNCTION "public"."remove_employee_v3"("emp_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_employee_v4"("emp_id" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Use a direct approach to delete records
    -- First, directly delete from employee_companies using a subquery approach
    DELETE FROM employee_companies 
    WHERE employee_id = emp_id;
    
    -- Then delete the employee record
    DELETE FROM employees 
    WHERE id = emp_id;
END;
$$;


ALTER FUNCTION "public"."remove_employee_v4"("emp_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_employee_v5"("emp_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Delete employee company associations first
    DELETE FROM employee_companies WHERE employee_id = emp_id;
    
    -- Delete the employee
    DELETE FROM employees WHERE id = emp_id;
END;
$$;


ALTER FUNCTION "public"."remove_employee_v5"("emp_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_maintenance"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result TEXT := '';
    archived_count INTEGER;
BEGIN
    -- Archive old notifications
    SELECT archive_old_notifications() INTO archived_count;
    result := result || format('Archived %s old notifications. ', archived_count);
    
    -- Update table statistics
    ANALYZE notifications;
    ANALYZE quotations;
    ANALYZE sales_performance_metrics;
    result := result || 'Updated table statistics. ';
    
    -- Clean up old system logs (keep last 30 days)
    DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '30 days';
    result := result || 'Cleaned up old system logs. ';
    
    -- Log maintenance completion
    INSERT INTO system_logs (action, details) 
    VALUES ('maintenance_completed', jsonb_build_object('summary', result));
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."run_maintenance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_lead_source_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only run if lead_source has a value but lead_source_id is null
  IF NEW.lead_source IS NOT NULL AND NEW.lead_source_id IS NULL THEN
    -- Look up the lead_source_id from the lead_sources table
    SELECT id INTO NEW.lead_source_id 
    FROM lead_sources 
    WHERE LOWER(name) = LOWER(NEW.lead_source);
    
    -- Log if we couldn't find a matching source
    IF NEW.lead_source_id IS NULL THEN
      RAISE NOTICE 'No matching lead source found for: %', NEW.lead_source;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_lead_source_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_session_variable"("var_name" "text", "var_value" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE format('SET LOCAL %I.%s = %L', 
                split_part(var_name, '.', 1), 
                split_part(var_name, '.', 2), 
                var_value);
END;
$$;


ALTER FUNCTION "public"."set_session_variable"("var_name" "text", "var_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_hr_activities_function"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- The function is created above, so we don't need to do anything else here
END;
$$;


ALTER FUNCTION "public"."setup_hr_activities_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."should_batch_notification"("p_user_id" integer, "p_type" character varying, "p_batch_key" character varying, "p_batch_window_minutes" integer DEFAULT 15) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    last_batch_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if similar notification was sent recently
    SELECT last_sent INTO last_batch_time
    FROM notification_batches
    WHERE user_id = p_user_id 
    AND notification_type = p_type 
    AND batch_key = p_batch_key;
    
    -- If no previous batch or batch window has passed, don't batch
    IF last_batch_time IS NULL OR 
       last_batch_time < NOW() - INTERVAL '1 minute' * p_batch_window_minutes THEN
        
        -- Update or insert batch record
        INSERT INTO notification_batches (user_id, notification_type, batch_key, last_sent, count)
        VALUES (p_user_id, p_type, p_batch_key, NOW(), 1)
        ON CONFLICT (user_id, notification_type, batch_key)
        DO UPDATE SET last_sent = NOW(), count = notification_batches.count + 1;
        
        RETURN FALSE; -- Don't batch, send notification
    END IF;
    
    -- Update batch count
    UPDATE notification_batches 
    SET count = count + 1
    WHERE user_id = p_user_id 
    AND notification_type = p_type 
    AND batch_key = p_batch_key;
    
    RETURN TRUE; -- Batch this notification
END;
$$;


ALTER FUNCTION "public"."should_batch_notification"("p_user_id" integer, "p_type" character varying, "p_batch_key" character varying, "p_batch_window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."should_skip_audit_trigger"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if the app.disable_audit_logging session variable is set to 'true'
  RETURN COALESCE(current_setting('app.disable_audit_logging', true), 'false') = 'true';
END;
$$;


ALTER FUNCTION "public"."should_skip_audit_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_employee_location"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If branch_id is NULL, set location to 'Remote'
    IF NEW.branch_id IS NULL THEN
        NEW.location = 'Remote';
    ELSE
        -- Update employee location with branch location
        SELECT b.location INTO NEW.location
        FROM branches b
        WHERE b.id = NEW.branch_id;
        
        -- If no branch found or branch has no location, set to 'Unknown'
        IF NEW.location IS NULL THEN
            NEW.location = 'Unknown';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_employee_location"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_employee_primary_company"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- When a primary company is set, update the employee's company_id
  IF NEW.is_primary = true THEN
    UPDATE employees
    SET company_id = NEW.company_id
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_employee_primary_company"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."table_exists"("table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  exists_val boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_name = table_name
  ) INTO exists_val;
  
  RETURN exists_val;
END;
$$;


ALTER FUNCTION "public"."table_exists"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_lead_reallocation"("p_employee_id" integer, "p_new_status" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_old_status TEXT;
  v_lead_count INTEGER;
  v_result TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM employees
  WHERE id = p_employee_id;

  -- Get current lead count
  SELECT COUNT(*) INTO v_lead_count
  FROM leads
  WHERE assigned_to = p_employee_id
  AND status NOT IN ('WON', 'LOST', 'REJECTED');

  -- Update employee status
  UPDATE employees
  SET status = p_new_status,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_employee_id;

  -- Get new lead count
  SELECT COUNT(*) INTO v_lead_count
  FROM leads
  WHERE assigned_to = p_employee_id
  AND status NOT IN ('WON', 'LOST', 'REJECTED');

  v_result := format(
    'Status changed from %s to %s. Remaining assigned leads: %s',
    v_old_status,
    p_new_status,
    v_lead_count
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."test_lead_reallocation"("p_employee_id" integer, "p_new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_user_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update most active hours based on activity time
    UPDATE user_behavior_analytics 
    SET 
        most_active_hours = array_append(
            most_active_hours, 
            EXTRACT(HOUR FROM NEW.created_at)::INTEGER
        ),
        last_activity = NEW.created_at,
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_user_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_clients_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_clients_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_name"("p_event_id" "text", "p_name" character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.events
    SET name = p_name
    WHERE event_id = p_event_id
    RETURNING jsonb_build_object(
        'id', id,
        'event_id', event_id,
        'name', name,
        'is_active', is_active,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO result;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Event with ID % not found', p_event_id;
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_event_name"("p_event_id" "text", "p_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_status"("p_event_id" "text", "p_is_active" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.events
    SET is_active = p_is_active
    WHERE event_id = p_event_id
    RETURNING jsonb_build_object(
        'id', id,
        'event_id', event_id,
        'name', name,
        'is_active', is_active,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO result;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Event with ID % not found', p_event_id;
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_event_status"("p_event_id" "text", "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_menu_item_permissions"("p_role_id" integer, "p_menu_item_id" integer, "p_can_view" boolean, "p_can_add" boolean, "p_can_edit" boolean, "p_can_delete" boolean) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the permission record exists
  IF EXISTS (
    SELECT 1 FROM role_menu_permissions 
    WHERE role_id = p_role_id AND menu_item_id = p_menu_item_id
  ) THEN
    -- Update existing permission
    UPDATE role_menu_permissions
    SET 
      can_view = p_can_view,
      can_add = p_can_add,
      can_edit = p_can_edit,
      can_delete = p_can_delete,
      updated_at = NOW()
    WHERE role_id = p_role_id AND menu_item_id = p_menu_item_id;
  ELSE
    -- Insert new permission
    INSERT INTO role_menu_permissions (
      role_id, menu_item_id, can_view, can_add, can_edit, can_delete, created_at, updated_at
    ) VALUES (
      p_role_id, p_menu_item_id, p_can_view, p_can_add, p_can_edit, p_can_delete, NOW(), NOW()
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating menu permissions: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."update_menu_item_permissions"("p_role_id" integer, "p_menu_item_id" integer, "p_can_view" boolean, "p_can_add" boolean, "p_can_edit" boolean, "p_can_delete" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_quotation_approval_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_quotation_approval_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_quotation_workflow_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- When approval is granted, update quotation status to 'approved'
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    UPDATE quotations 
    SET workflow_status = 'approved'
    WHERE id = NEW.quotation_id;
  END IF;
  
  -- When approval is rejected, update quotation status to 'rejected'
  IF NEW.approval_status = 'rejected' AND OLD.approval_status != 'rejected' THEN
    UPDATE quotations 
    SET workflow_status = 'rejected'
    WHERE id = NEW.quotation_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_quotation_workflow_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_quotations_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_quotations_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_supplier_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_supplier_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_performance_metrics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only process when task is completed
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    INSERT INTO task_performance_metrics (
      task_id,
      lead_id,
      quotation_id,
      assigned_to,
      created_date,
      due_date,
      completed_date,
      days_to_complete,
      hours_estimated,
      hours_actual,
      efficiency_ratio,
      priority_level,
      was_overdue,
      quality_rating,
      revenue_impact
    ) VALUES (
      NEW.id,
      NEW.lead_id,
      NEW.quotation_id,
      NEW.assigned_to,
      NEW.created_at::DATE,
      NEW.due_date::DATE,
      NEW.completed_at::DATE,
      CASE 
        WHEN NEW.completed_at IS NOT NULL THEN 
          EXTRACT(DAY FROM NEW.completed_at - NEW.created_at)
        ELSE NULL 
      END,
      NEW.estimated_hours,
      NEW.actual_hours,
      CASE 
        WHEN NEW.estimated_hours > 0 AND NEW.actual_hours IS NOT NULL THEN 
          NEW.actual_hours / NEW.estimated_hours
        ELSE NULL 
      END,
      NEW.priority,
      CASE 
        WHEN NEW.due_date IS NOT NULL AND NEW.completed_at IS NOT NULL THEN 
          NEW.completed_at > NEW.due_date
        ELSE FALSE 
      END,
      (NEW.metadata->>'quality_rating')::INTEGER,
      (NEW.metadata->>'estimated_value')::DECIMAL
    )
    ON CONFLICT (task_id) DO UPDATE SET
      completed_date = EXCLUDED.completed_date,
      days_to_complete = EXCLUDED.days_to_complete,
      hours_actual = EXCLUDED.hours_actual,
      efficiency_ratio = EXCLUDED.efficiency_ratio,
      was_overdue = EXCLUDED.was_overdue,
      quality_rating = EXCLUDED.quality_rating,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_task_performance_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_engagement_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update engagement score based on notification interaction
    UPDATE user_behavior_analytics 
    SET 
        engagement_score = LEAST(1.0, GREATEST(0.0, 
            CASE 
                WHEN NEW.event_type = 'clicked' THEN engagement_score + 0.1
                WHEN NEW.event_type = 'viewed' THEN engagement_score + 0.05
                WHEN NEW.event_type = 'dismissed' THEN engagement_score - 0.02
                ELSE engagement_score
            END
        )),
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_engagement_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vendor_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vendor_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_ai_response"("response_text" "text") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  validation_result JSON;
  hallucination_score INTEGER := 0;
  warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for potential fake dates (dates before current business start)
  IF response_text ~* '\d{4}-\d{2}-\d{2}' AND response_text ~* '(2020|2021|2022|2023)' THEN
    hallucination_score := hallucination_score + 1;
    warnings := array_append(warnings, 'Potential fake historical dates detected');
  END IF;
  
  -- Check for made-up quotation references
  IF response_text ~* 'quotation.*sent.*\d{4}-\d{2}-\d{2}' THEN
    hallucination_score := hallucination_score + 1;
    warnings := array_append(warnings, 'Potential fake quotation timeline detected');
  END IF;
  
  -- Return validation result
  SELECT json_build_object(
    'is_valid', hallucination_score = 0,
    'hallucination_score', hallucination_score,
    'warnings', warnings,
    'validation_timestamp', NOW()
  ) INTO validation_result;
  
  RETURN validation_result;
END;
$$;


ALTER FUNCTION "public"."validate_ai_response"("response_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_department_designation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If both department_id and designation_id are set
  IF NEW.department_id IS NOT NULL AND NEW.designation_id IS NOT NULL THEN
    -- Check if the designation belongs to the department
    IF NOT EXISTS (
      SELECT 1 FROM designations 
      WHERE id = NEW.designation_id 
      AND department_id = NEW.department_id
    ) THEN
      RAISE EXCEPTION 'The selected designation does not belong to the selected department';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_department_designation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_employee_allocation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_allocation INTEGER;
  active_allocations INTEGER;
BEGIN
  -- Check if dates are valid
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION 'End date cannot be before start date';
  END IF;
  
  -- Set status based on dates
  IF NEW.start_date IS NOT NULL AND NEW.start_date > CURRENT_DATE THEN
    NEW.status := 'pending';
  ELSIF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSE
    NEW.status := 'active';
  END IF;
  
  -- Check for overlapping allocations with the same company AND branch
  -- Modified to check for specific company-branch combination instead of just company
  IF EXISTS (
    SELECT 1 FROM employee_companies ec
    WHERE ec.employee_id = NEW.employee_id
      AND ec.company_id = NEW.company_id
      AND ec.branch_id = NEW.branch_id
      AND ec.id != NEW.id
      AND (
        (NEW.start_date IS NULL) OR
        (ec.end_date IS NULL) OR
        (NEW.start_date <= ec.end_date AND (NEW.end_date IS NULL OR NEW.end_date >= ec.start_date))
      )
  ) THEN
    RAISE EXCEPTION 'Employee already has an allocation for this company and branch during this period';
  END IF;
  
  -- Calculate total allocation for active allocations
  SELECT COALESCE(SUM(allocation_percentage), 0)
  INTO total_allocation
  FROM employee_companies
  WHERE employee_id = NEW.employee_id
    AND id != NEW.id
    AND (status = 'active' OR status = 'pending');
  
  -- Check if total allocation exceeds 100%
  IF (total_allocation + NEW.allocation_percentage) > 100 AND (NEW.status = 'active' OR NEW.status = 'pending') THEN
    RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%%. Current total: %%%, Adding: %%%', 
      total_allocation, NEW.allocation_percentage;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_employee_allocation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_employee_company_percentage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_percentage INTEGER;
BEGIN
    -- Calculate the total percentage for this employee
    SELECT COALESCE(SUM(percentage), 0) INTO total_percentage
    FROM employee_companies
    WHERE employee_id = NEW.employee_id AND (id != NEW.id OR NEW.id IS NULL);
    
    -- Add the new percentage
    total_percentage := total_percentage + NEW.percentage;
    
    -- Check if the total is exactly 100%
    IF total_percentage != 100 THEN
        RAISE EXCEPTION 'Total percentage allocation must be exactly 100%%. Current total: %', total_percentage;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_employee_company_percentage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_phone_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  -- Basic validation: phone should be at least 10 characters and contain only digits, +, -, and spaces
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND 
     (LENGTH(NEW.phone) < 10 OR NEW.phone !~ '^[0-9+\-\s]+$') THEN
    RAISE EXCEPTION 'Invalid phone number format. Phone must be at least 10 characters and contain only digits, +, -, and spaces.';
  END IF;
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."validate_phone_number"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "audit_security"."audit_trail" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "action" character varying(50) NOT NULL,
    "entity_type" character varying(100) NOT NULL,
    "entity_id" character varying(100) NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" character varying(45),
    "user_agent" "text",
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "audit_security"."audit_trail" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "audit_security"."audit_trail_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "audit_security"."audit_trail_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "audit_security"."audit_trail_id_seq" OWNED BY "audit_security"."audit_trail"."id";



CREATE TABLE IF NOT EXISTS "audit_security"."permissions" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "resource" character varying(100) NOT NULL,
    "action" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE "audit_security"."permissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "audit_security"."permissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "audit_security"."permissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "audit_security"."permissions_id_seq" OWNED BY "audit_security"."permissions"."id";



CREATE TABLE IF NOT EXISTS "audit_security"."role_permissions" (
    "id" integer NOT NULL,
    "role_id" integer,
    "permission_id" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE "audit_security"."role_permissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "audit_security"."role_permissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "audit_security"."role_permissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "audit_security"."role_permissions_id_seq" OWNED BY "audit_security"."role_permissions"."id";



CREATE TABLE IF NOT EXISTS "audit_security"."roles" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE "audit_security"."roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "audit_security"."roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "audit_security"."roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "audit_security"."roles_id_seq" OWNED BY "audit_security"."roles"."id";



CREATE TABLE IF NOT EXISTS "audit_security"."user_roles" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "role_id" integer,
    "branch_id" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE "audit_security"."user_roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "audit_security"."user_roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "audit_security"."user_roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "audit_security"."user_roles_id_seq" OWNED BY "audit_security"."user_roles"."id";



CREATE TABLE IF NOT EXISTS "master_data"."account_heads" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "category" character varying(100),
    "type" character varying(50) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."account_heads" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."account_heads_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."account_heads_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."account_heads_id_seq" OWNED BY "master_data"."account_heads"."id";



CREATE TABLE IF NOT EXISTS "master_data"."audio_genres" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."audio_genres" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."audio_genres_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."audio_genres_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."audio_genres_id_seq" OWNED BY "master_data"."audio_genres"."id";



CREATE TABLE IF NOT EXISTS "master_data"."bank_accounts" (
    "id" integer NOT NULL,
    "company_id" integer NOT NULL,
    "account_name" character varying(255) NOT NULL,
    "account_number" character varying(50) NOT NULL,
    "bank_name" character varying(255) NOT NULL,
    "branch_name" character varying(255),
    "ifsc_code" character varying(20),
    "account_type" character varying(50),
    "opening_balance" numeric(15,2) DEFAULT 0.00,
    "current_balance" numeric(15,2) DEFAULT 0.00,
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."bank_accounts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."bank_accounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."bank_accounts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."bank_accounts_id_seq" OWNED BY "master_data"."bank_accounts"."id";



CREATE TABLE IF NOT EXISTS "master_data"."branches" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "address" "text",
    "manager" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."branches" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."branches_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."branches_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."branches_id_seq" OWNED BY "master_data"."branches"."id";



CREATE TABLE IF NOT EXISTS "master_data"."checklist_items" (
    "id" integer NOT NULL,
    "checklist_id" integer NOT NULL,
    "item_text" "text" NOT NULL,
    "sequence" integer,
    "is_required" boolean DEFAULT false,
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."checklist_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."checklist_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."checklist_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."checklist_items_id_seq" OWNED BY "master_data"."checklist_items"."id";



CREATE TABLE IF NOT EXISTS "master_data"."checklists" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "category" character varying(100),
    "description" "text",
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."checklists" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."checklists_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."checklists_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."checklists_id_seq" OWNED BY "master_data"."checklists"."id";



CREATE TABLE IF NOT EXISTS "master_data"."clients" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "contact" character varying(100),
    "email" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."clients" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."clients_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."clients_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."clients_id_seq" OWNED BY "master_data"."clients"."id";



CREATE TABLE IF NOT EXISTS "master_data"."companies" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."companies" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."companies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."companies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."companies_id_seq" OWNED BY "master_data"."companies"."id";



CREATE TABLE IF NOT EXISTS "master_data"."deliverables" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "category" character varying(100),
    "type" character varying(50),
    "description" "text",
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."deliverables" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."deliverables_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."deliverables_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."deliverables_id_seq" OWNED BY "master_data"."deliverables"."id";



CREATE TABLE IF NOT EXISTS "master_data"."departments" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "head" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."departments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."departments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."departments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."departments_id_seq" OWNED BY "master_data"."departments"."id";



CREATE TABLE IF NOT EXISTS "master_data"."designations" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "department" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."designations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."designations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."designations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."designations_id_seq" OWNED BY "master_data"."designations"."id";



CREATE TABLE IF NOT EXISTS "master_data"."document_templates" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "category" character varying(100),
    "file_path" "text",
    "content_type" character varying(100),
    "description" "text",
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."document_templates" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."document_templates_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."document_templates_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."document_templates_id_seq" OWNED BY "master_data"."document_templates"."id";



CREATE TABLE IF NOT EXISTS "master_data"."muhurtham" (
    "id" integer NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "description" "text",
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."muhurtham" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."muhurtham_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."muhurtham_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."muhurtham_id_seq" OWNED BY "master_data"."muhurtham"."id";



CREATE TABLE IF NOT EXISTS "master_data"."payment_modes" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."payment_modes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."payment_modes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."payment_modes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."payment_modes_id_seq" OWNED BY "master_data"."payment_modes"."id";



CREATE TABLE IF NOT EXISTS "master_data"."service_deliverable_mapping" (
    "id" integer NOT NULL,
    "service_id" integer NOT NULL,
    "deliverable_id" integer NOT NULL,
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."service_deliverable_mapping" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."service_deliverable_mapping_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."service_deliverable_mapping_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."service_deliverable_mapping_id_seq" OWNED BY "master_data"."service_deliverable_mapping"."id";



CREATE TABLE IF NOT EXISTS "master_data"."services" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "category" character varying(100),
    "base_price" numeric(15,2) DEFAULT 0.00,
    "premium_price" numeric(15,2) DEFAULT 0.00,
    "elite_price" numeric(15,2) DEFAULT 0.00,
    "description" "text",
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."services" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."services_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."services_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."services_id_seq" OWNED BY "master_data"."services"."id";



CREATE TABLE IF NOT EXISTS "master_data"."suppliers" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "contact" character varying(100),
    "email" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."suppliers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."suppliers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."suppliers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."suppliers_id_seq" OWNED BY "master_data"."suppliers"."id";



CREATE TABLE IF NOT EXISTS "master_data"."vendors" (
    "id" integer NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "contact" character varying(100),
    "email" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "master_data"."vendors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "master_data"."vendors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "master_data"."vendors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "master_data"."vendors_id_seq" OWNED BY "master_data"."vendors"."id";



CREATE TABLE IF NOT EXISTS "public"."accounting_workflows" (
    "id" integer NOT NULL,
    "quotation_id" integer,
    "payment_id" integer,
    "instruction_id" integer,
    "status" character varying(30) DEFAULT 'pending_processing'::character varying,
    "total_amount" numeric(12,2) NOT NULL,
    "payment_type" character varying(20) NOT NULL,
    "processed_by" character varying(255),
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."accounting_workflows" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."accounting_workflows_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."accounting_workflows_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."accounting_workflows_id_seq" OWNED BY "public"."accounting_workflows"."id";



CREATE TABLE IF NOT EXISTS "public"."action_recommendations" (
    "id" integer NOT NULL,
    "quotation_id" integer NOT NULL,
    "recommendation_type" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "confidence_score" numeric(5,4) NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "suggested_action" "text" NOT NULL,
    "expected_impact" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "reasoning" "text" NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "action_recommendations_priority_check" CHECK (("priority" = ANY (ARRAY['urgent'::"text", 'high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "action_recommendations_recommendation_type_check" CHECK (("recommendation_type" = ANY (ARRAY['follow_up'::"text", 'price_adjustment'::"text", 'add_services'::"text", 'schedule_meeting'::"text", 'send_samples'::"text", 'create_urgency'::"text", 'escalate_to_manager'::"text", 'custom_proposal'::"text"])))
);


ALTER TABLE "public"."action_recommendations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."action_recommendations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."action_recommendations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."action_recommendations_id_seq" OWNED BY "public"."action_recommendations"."id";



CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_type" character varying(50) NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "text" NOT NULL,
    "entity_name" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "user_id" "uuid",
    "user_name" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."activities" IS 'Stores activity logs for all entities in the system';



CREATE TABLE IF NOT EXISTS "public"."ai_behavior_settings" (
    "id" integer NOT NULL,
    "setting_key" character varying(100) NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "category" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_behavior_settings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_behavior_settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ai_behavior_settings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_behavior_settings_id_seq" OWNED BY "public"."ai_behavior_settings"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_configurations" (
    "id" integer NOT NULL,
    "config_key" character varying(100) NOT NULL,
    "config_type" character varying(50) NOT NULL,
    "config_value" "text" NOT NULL,
    "version" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text"
);


ALTER TABLE "public"."ai_configurations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_configurations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ai_configurations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_configurations_id_seq" OWNED BY "public"."ai_configurations"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text",
    "country_code" "text",
    "name" "text",
    "source_id" "text",
    "source_url" "text",
    "internal_lead_source" "text",
    "internal_closure_date" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_decision_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notification_id" "text",
    "decision_type" "text" NOT NULL,
    "decision_data" "jsonb" NOT NULL,
    "model_version" "text" DEFAULT 'v1.0'::"text",
    "confidence_score" numeric(3,2),
    "execution_time" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_decision_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."predictive_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "insight_type" "text" NOT NULL,
    "probability" numeric(3,2) NOT NULL,
    "recommended_action" "text" NOT NULL,
    "trigger_conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "estimated_impact" numeric(3,2) DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "predictive_insights_probability_check" CHECK ((("probability" >= (0)::numeric) AND ("probability" <= (1)::numeric))),
    CONSTRAINT "predictive_insights_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'triggered'::"text", 'completed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."predictive_insights" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ai_insights_summary" AS
 SELECT "pi"."user_id",
    "pi"."insight_type",
    "pi"."probability",
    "pi"."recommended_action",
    "pi"."status",
    "pi"."created_at",
    "pi"."expires_at",
        CASE
            WHEN ("pi"."expires_at" < "now"()) THEN true
            ELSE false
        END AS "is_expired"
   FROM "public"."predictive_insights" "pi"
  WHERE ("pi"."status" <> 'expired'::"text")
  ORDER BY "pi"."probability" DESC, "pi"."created_at" DESC;


ALTER TABLE "public"."ai_insights_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_performance_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_type" "text" NOT NULL,
    "prediction_data" "jsonb" NOT NULL,
    "actual_outcome" "jsonb",
    "accuracy_score" numeric(3,2),
    "confidence_score" numeric(3,2),
    "model_version" "text" DEFAULT 'v1.0'::"text",
    "feedback_loop_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_performance_tracking_model_type_check" CHECK (("model_type" = ANY (ARRAY['timing'::"text", 'personalization'::"text", 'content'::"text", 'channel'::"text"])))
);


ALTER TABLE "public"."ai_performance_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_prompt_templates" (
    "id" integer NOT NULL,
    "template_name" character varying(100) NOT NULL,
    "template_content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '{}'::"jsonb",
    "category" character varying(50) NOT NULL,
    "is_default" boolean DEFAULT false,
    "version" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_prompt_templates" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_prompt_templates_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ai_prompt_templates_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_prompt_templates_id_seq" OWNED BY "public"."ai_prompt_templates"."id";



CREATE TABLE IF NOT EXISTS "public"."ai_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "recommendation_type" "text" NOT NULL,
    "recommendation_data" "jsonb" NOT NULL,
    "confidence_score" numeric(3,2) NOT NULL,
    "context_data" "jsonb" DEFAULT '{}'::"jsonb",
    "applied" boolean DEFAULT false,
    "feedback_score" integer,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_recommendations_feedback_score_check" CHECK ((("feedback_score" >= 1) AND ("feedback_score" <= 5))),
    CONSTRAINT "ai_recommendations_recommendation_type_check" CHECK (("recommendation_type" = ANY (ARRAY['content'::"text", 'timing'::"text", 'channel'::"text", 'frequency'::"text"])))
);


ALTER TABLE "public"."ai_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_tasks" (
    "id" integer NOT NULL,
    "task_title" character varying(255) NOT NULL,
    "task_description" "text",
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "due_date" timestamp with time zone,
    "category" character varying(50),
    "assigned_to" character varying(255),
    "assigned_by" character varying(255),
    "metadata" "jsonb",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_name" character varying(255),
    "business_impact" "text",
    "ai_reasoning" "text",
    "estimated_value" numeric(12,2),
    "lead_id" integer,
    "quotation_id" integer,
    "actual_hours" numeric(5,2),
    "quality_rating" integer,
    CONSTRAINT "ai_tasks_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying, 'LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'URGENT'::character varying])::"text"[]))),
    CONSTRAINT "ai_tasks_quality_rating_check" CHECK ((("quality_rating" >= 1) AND ("quality_rating" <= 5))),
    CONSTRAINT "ai_tasks_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'PENDING'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::"text"[])))
);


ALTER TABLE "public"."ai_tasks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ai_tasks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ai_tasks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ai_tasks_id_seq" OWNED BY "public"."ai_tasks"."id";



CREATE TABLE IF NOT EXISTS "public"."analytics_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "cache_data" "jsonb" NOT NULL,
    "cache_type" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_type" "text" NOT NULL,
    "metric_value" numeric(10,4) NOT NULL,
    "metric_unit" "text" DEFAULT 'count'::"text",
    "dimensions" "jsonb" DEFAULT '{}'::"jsonb",
    "time_period" "text" NOT NULL,
    "recorded_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "analytics_metrics_metric_type_check" CHECK (("metric_type" = ANY (ARRAY['engagement'::"text", 'performance'::"text", 'user_behavior'::"text", 'ai_accuracy'::"text"]))),
    CONSTRAINT "analytics_metrics_time_period_check" CHECK (("time_period" = ANY (ARRAY['hourly'::"text", 'daily'::"text", 'weekly'::"text", 'monthly'::"text"])))
);


ALTER TABLE "public"."analytics_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auditions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "date" "date" NOT NULL,
    "location" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auditions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" integer NOT NULL,
    "company_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "address" "text" NOT NULL,
    "phone" character varying(50),
    "email" character varying(255),
    "manager_id" integer,
    "is_remote" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "branch_code" character varying(30),
    "location" character varying(255)
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


COMMENT ON COLUMN "public"."branches"."branch_code" IS 'Unique identifier code for the branch, auto-generated from company code';



CREATE SEQUENCE IF NOT EXISTS "public"."branches_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."branches_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."branches_id_seq" OWNED BY "public"."branches"."id";



CREATE TABLE IF NOT EXISTS "public"."bug_attachments" (
    "id" bigint NOT NULL,
    "bug_id" bigint,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bug_attachments" OWNER TO "postgres";


ALTER TABLE "public"."bug_attachments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."bug_attachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bug_comments" (
    "id" bigint NOT NULL,
    "bug_id" bigint,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bug_comments" OWNER TO "postgres";


ALTER TABLE "public"."bug_comments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."bug_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bugs" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "assignee_id" "uuid",
    "reporter_id" "uuid" NOT NULL,
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bugs_severity_check" CHECK (("severity" = ANY (ARRAY['critical'::"text", 'high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "bugs_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."bugs" OWNER TO "postgres";


ALTER TABLE "public"."bugs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."bugs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."business_trends" (
    "id" integer NOT NULL,
    "trend_type" "text" NOT NULL,
    "trend_period" "text" NOT NULL,
    "trend_direction" "text" NOT NULL,
    "trend_strength" numeric(5,4) NOT NULL,
    "current_value" numeric(15,4) NOT NULL,
    "previous_value" numeric(15,4) NOT NULL,
    "percentage_change" numeric(8,4) NOT NULL,
    "statistical_significance" numeric(5,4) NOT NULL,
    "insights" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "recommendations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "analyzed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "business_trends_trend_direction_check" CHECK (("trend_direction" = ANY (ARRAY['increasing'::"text", 'decreasing'::"text", 'stable'::"text"]))),
    CONSTRAINT "business_trends_trend_type_check" CHECK (("trend_type" = ANY (ARRAY['conversion_rate'::"text", 'avg_deal_size'::"text", 'sales_cycle_length'::"text", 'seasonal_patterns'::"text", 'service_demand'::"text", 'pricing_trends'::"text"])))
);


ALTER TABLE "public"."business_trends" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."business_trends_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."business_trends_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."business_trends_id_seq" OWNED BY "public"."business_trends"."id";



CREATE TABLE IF NOT EXISTS "public"."call_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" character varying(255) NOT NULL,
    "overall_sentiment" character varying(20),
    "sentiment_score" numeric(3,2) DEFAULT 0,
    "client_sentiment" character varying(20),
    "agent_sentiment" character varying(20),
    "call_intent" character varying(255),
    "key_topics" "jsonb" DEFAULT '[]'::"jsonb",
    "business_outcomes" "jsonb" DEFAULT '[]'::"jsonb",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "agent_professionalism_score" integer,
    "agent_responsiveness_score" integer,
    "agent_knowledge_score" integer,
    "agent_closing_effectiveness" integer,
    "client_engagement_level" character varying(20),
    "client_interest_level" character varying(20),
    "client_objection_handling" "jsonb" DEFAULT '[]'::"jsonb",
    "client_buying_signals" "jsonb" DEFAULT '[]'::"jsonb",
    "forbidden_words_detected" "jsonb" DEFAULT '[]'::"jsonb",
    "compliance_issues" "jsonb" DEFAULT '[]'::"jsonb",
    "risk_level" character varying(20),
    "talk_time_ratio" numeric(4,2) DEFAULT 1.0,
    "interruptions" integer DEFAULT 0,
    "silent_periods" integer DEFAULT 0,
    "call_quality_score" numeric(3,1) DEFAULT 7.0,
    "quote_discussed" boolean DEFAULT false,
    "budget_mentioned" boolean DEFAULT false,
    "timeline_discussed" boolean DEFAULT false,
    "next_steps_agreed" boolean DEFAULT false,
    "follow_up_required" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."call_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" character varying(255) NOT NULL,
    "conversion_indicators" "jsonb" DEFAULT '[]'::"jsonb",
    "objection_patterns" "jsonb" DEFAULT '[]'::"jsonb",
    "successful_techniques" "jsonb" DEFAULT '[]'::"jsonb",
    "improvement_areas" "jsonb" DEFAULT '[]'::"jsonb",
    "decision_factors" "jsonb" DEFAULT '[]'::"jsonb",
    "pain_points" "jsonb" DEFAULT '[]'::"jsonb",
    "preferences" "jsonb" DEFAULT '[]'::"jsonb",
    "concerns" "jsonb" DEFAULT '[]'::"jsonb",
    "market_trends" "jsonb" DEFAULT '[]'::"jsonb",
    "competitive_mentions" "jsonb" DEFAULT '[]'::"jsonb",
    "pricing_feedback" "jsonb" DEFAULT '[]'::"jsonb",
    "service_feedback" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."call_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_transcriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" character varying(255) NOT NULL,
    "task_id" "uuid",
    "lead_id" integer,
    "client_name" character varying(255) NOT NULL,
    "sales_agent" character varying(255) NOT NULL,
    "phone_number" character varying(20) NOT NULL,
    "duration" integer NOT NULL,
    "recording_url" "text",
    "transcript" "text" NOT NULL,
    "confidence_score" numeric(3,2) DEFAULT 0.8,
    "language" character varying(10) DEFAULT 'en'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "detected_language" character varying(10),
    "status" character varying(20) DEFAULT 'processing'::character varying,
    "notes" "text",
    CONSTRAINT "check_status_valid" CHECK ((("status")::"text" = ANY ((ARRAY['processing'::character varying, 'transcribing'::character varying, 'completed'::character varying, 'error'::character varying])::"text"[])))
);


ALTER TABLE "public"."call_transcriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."call_transcriptions"."task_id" IS 'Related task ID from ai_tasks table';



COMMENT ON COLUMN "public"."call_transcriptions"."status" IS 'Processing status: processing, transcribing, completed, error';



COMMENT ON COLUMN "public"."call_transcriptions"."notes" IS 'Employee notes about the call';



CREATE TABLE IF NOT EXISTS "public"."chat_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "name" "text",
    "message" "text" NOT NULL,
    "reply" "text" NOT NULL,
    "channel" "text" DEFAULT 'whatsapp'::"text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_insights" (
    "id" integer NOT NULL,
    "client_name" "text" NOT NULL,
    "client_email" "text",
    "client_phone" "text",
    "sentiment_score" numeric(5,4),
    "engagement_level" "text",
    "conversion_probability" numeric(5,4),
    "preferred_communication_method" "text",
    "optimal_follow_up_time" "text",
    "price_sensitivity" "text",
    "decision_timeline_days" integer,
    "insights" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_analyzed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "client_insights_engagement_level_check" CHECK (("engagement_level" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "client_insights_price_sensitivity_check" CHECK (("price_sensitivity" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."client_insights" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."client_insights_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."client_insights_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."client_insights_id_seq" OWNED BY "public"."client_insights"."id";



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" integer NOT NULL,
    "client_code" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "company_id" integer NOT NULL,
    "contact_person" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(50) NOT NULL,
    "address" "text" NOT NULL,
    "city" character varying(100) NOT NULL,
    "state" character varying(100) NOT NULL,
    "postal_code" character varying(20) NOT NULL,
    "country" character varying(100) NOT NULL,
    "category" character varying(20) NOT NULL,
    "status" character varying(20) NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "country_code" character varying(10) DEFAULT '+91'::character varying,
    "is_whatsapp" boolean DEFAULT false,
    "whatsapp_country_code" character varying(10),
    "whatsapp_number" character varying(20),
    "has_separate_whatsapp" boolean DEFAULT false,
    CONSTRAINT "clients_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['BUSINESS'::character varying, 'INDIVIDUAL'::character varying, 'CORPORATE'::character varying, 'GOVERNMENT'::character varying, 'NON-PROFIT'::character varying])::"text"[]))),
    CONSTRAINT "clients_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'PENDING'::character varying])::"text"[])))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."clients_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."clients_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."clients_id_seq" OWNED BY "public"."clients"."id";



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "registration_number" character varying(100),
    "tax_id" character varying(100),
    "address" "text",
    "phone" character varying(50),
    "email" character varying(255),
    "website" character varying(255),
    "founded_date" "date",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "company_code" character varying(20)
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."companies"."company_code" IS 'Unique identifier code for the company';



CREATE SEQUENCE IF NOT EXISTS "public"."companies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."companies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."companies_id_seq" OWNED BY "public"."companies"."id";



CREATE TABLE IF NOT EXISTS "public"."company_partners" (
    "company_id" integer NOT NULL,
    "partner_id" integer NOT NULL,
    "contract_details" "text",
    "contract_start_date" "date",
    "contract_end_date" "date",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."company_partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliverable_master" (
    "id" bigint NOT NULL,
    "category" "text" NOT NULL,
    "type" "text" NOT NULL,
    "deliverable_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "deliverable_master_category_check" CHECK (("category" = ANY (ARRAY['Main'::"text", 'Optional'::"text"]))),
    CONSTRAINT "deliverable_master_type_check" CHECK (("type" = ANY (ARRAY['Photo'::"text", 'Video'::"text"])))
);


ALTER TABLE "public"."deliverable_master" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."deliverable_master_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."deliverable_master_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."deliverable_master_id_seq" OWNED BY "public"."deliverable_master"."id";



CREATE TABLE IF NOT EXISTS "public"."deliverables" (
    "id" integer NOT NULL,
    "deliverable_cat" character varying(50) NOT NULL,
    "deliverable_type" character varying(50) NOT NULL,
    "deliverable_id" integer,
    "deliverable_name" character varying(255) NOT NULL,
    "process_name" character varying(255) NOT NULL,
    "has_customer" boolean DEFAULT false,
    "has_employee" boolean DEFAULT false,
    "has_qc" boolean DEFAULT false,
    "has_vendor" boolean DEFAULT false,
    "link" character varying(255),
    "sort_order" integer DEFAULT 0,
    "timing_type" character varying(20) DEFAULT 'days'::character varying,
    "tat" integer,
    "tat_value" integer,
    "buffer" integer,
    "skippable" boolean DEFAULT false,
    "employee" "jsonb",
    "has_download_option" boolean DEFAULT false,
    "has_task_process" boolean DEFAULT true,
    "has_upload_folder_path" boolean DEFAULT false,
    "process_starts_from" integer DEFAULT 0,
    "status" integer DEFAULT 1,
    "on_start_template" character varying(255),
    "on_complete_template" character varying(255),
    "on_correction_template" character varying(255),
    "input_names" "jsonb",
    "created_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" integer,
    "stream" character varying(10),
    "stage" character varying(10),
    "package_included" "jsonb" DEFAULT '{"basic": false, "elite": false, "premium": false}'::"jsonb",
    "basic_price" numeric,
    "elite_price" numeric,
    "premium_price" numeric,
    CONSTRAINT "check_deliverable_cat" CHECK ((("deliverable_cat")::"text" = ANY ((ARRAY['Main'::character varying, 'Optional'::character varying])::"text"[]))),
    CONSTRAINT "check_deliverable_type" CHECK ((("deliverable_type")::"text" = ANY ((ARRAY['Photo'::character varying, 'Video'::character varying])::"text"[]))),
    CONSTRAINT "check_stream" CHECK (((("stream")::"text" = ANY ((ARRAY['UP'::character varying, 'DOWN'::character varying])::"text"[])) OR ("stream" IS NULL))),
    CONSTRAINT "check_timing_type" CHECK ((("timing_type")::"text" = ANY ((ARRAY['days'::character varying, 'hr'::character varying, 'min'::character varying])::"text"[])))
);


ALTER TABLE "public"."deliverables" OWNER TO "postgres";


COMMENT ON TABLE "public"."deliverables" IS 'Post-production deliverables workflow system';



CREATE SEQUENCE IF NOT EXISTS "public"."deliverables_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."deliverables_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."deliverables_id_seq" OWNED BY "public"."deliverables"."id";



CREATE TABLE IF NOT EXISTS "public"."department_instructions" (
    "id" integer NOT NULL,
    "quotation_id" integer,
    "payment_id" integer,
    "instructions" "jsonb" NOT NULL,
    "status" character varying(20) DEFAULT 'pending_approval'::character varying,
    "created_by" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."department_instructions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."department_instructions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."department_instructions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."department_instructions_id_seq" OWNED BY "public"."department_instructions"."id";



CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "manager_id" integer,
    "parent_department_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."departments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."departments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."departments_id_seq" OWNED BY "public"."departments"."id";



CREATE TABLE IF NOT EXISTS "public"."designations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "department_id" integer,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."designations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."designations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."designations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."designations_id_seq" OWNED BY "public"."designations"."id";



CREATE TABLE IF NOT EXISTS "public"."email_notification_templates" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html_template" "text" NOT NULL,
    "text_template" "text" NOT NULL,
    "variables" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_companies" (
    "id" integer NOT NULL,
    "employee_id" integer,
    "company_id" integer,
    "branch_id" integer,
    "allocation_percentage" integer NOT NULL,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "start_date" "date",
    "end_date" "date",
    "project_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    CONSTRAINT "employee_companies_allocation_percentage_check" CHECK ((("allocation_percentage" > 0) AND ("allocation_percentage" <= 100)))
);


ALTER TABLE "public"."employee_companies" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."employee_companies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."employee_companies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."employee_companies_id_seq" OWNED BY "public"."employee_companies"."id";



CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" integer NOT NULL,
    "employee_id" character varying(20) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "email" character varying(255),
    "phone" character varying(20),
    "address" "text",
    "city" character varying(100),
    "state" character varying(100),
    "zip_code" character varying(20),
    "country" character varying(100),
    "hire_date" "date",
    "termination_date" "date",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "department_id" integer,
    "designation_id" integer,
    "job_title" character varying(100),
    "home_branch_id" integer,
    "primary_company_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" character varying(255)
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."employees_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."employees_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."employees_id_seq" OWNED BY "public"."employees"."id";



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'Stores event information for client quotations';



CREATE TABLE IF NOT EXISTS "public"."follow_up_auditions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "audition_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "notes" "text",
    "follow_up_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."follow_up_auditions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instruction_approvals" (
    "id" integer NOT NULL,
    "instruction_id" integer,
    "approval_status" character varying(20) NOT NULL,
    "approved_by" character varying(255),
    "approved_at" timestamp with time zone,
    "comments" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "instruction_approvals_approval_status_check" CHECK ((("approval_status")::"text" = ANY ((ARRAY['submitted'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."instruction_approvals" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."instruction_approvals_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."instruction_approvals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."instruction_approvals_id_seq" OWNED BY "public"."instruction_approvals"."id";



CREATE TABLE IF NOT EXISTS "public"."lead_drafts" (
    "id" bigint NOT NULL,
    "phone" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_drafts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."lead_drafts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."lead_drafts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lead_drafts_id_seq" OWNED BY "public"."lead_drafts"."id";



CREATE TABLE IF NOT EXISTS "public"."lead_followups" (
    "id" integer NOT NULL,
    "lead_id" integer NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone,
    "contact_method" character varying(50) NOT NULL,
    "interaction_summary" "text",
    "status" character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    "outcome" "text",
    "notes" "text",
    "priority" character varying(10) DEFAULT 'medium'::character varying,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    "updated_at" timestamp with time zone,
    "completed_by" "uuid",
    "duration_minutes" integer,
    "follow_up_required" boolean DEFAULT false,
    "next_follow_up_date" timestamp with time zone,
    "followup_type" "text",
    "workflow_stage" character varying(50),
    "quotation_id" integer,
    CONSTRAINT "lead_followups_contact_method_check" CHECK ((("contact_method")::"text" = ANY (ARRAY[('email'::character varying)::"text", ('phone'::character varying)::"text", ('in_person'::character varying)::"text", ('video_call'::character varying)::"text", ('text_message'::character varying)::"text", ('social_media'::character varying)::"text", ('whatsapp_call'::character varying)::"text", ('whatsapp_message'::character varying)::"text", ('other'::character varying)::"text"]))),
    CONSTRAINT "lead_followups_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "lead_followups_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['scheduled'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'missed'::character varying, 'rescheduled'::character varying])::"text"[]))),
    CONSTRAINT "valid_completed_at" CHECK ((((("status")::"text" = 'completed'::"text") AND ("completed_at" IS NOT NULL)) OR ((("status")::"text" <> 'completed'::"text") AND ("completed_at" IS NULL)))),
    CONSTRAINT "valid_next_follow_up" CHECK (((("follow_up_required" = true) AND ("next_follow_up_date" IS NOT NULL)) OR ("follow_up_required" = false)))
);


ALTER TABLE "public"."lead_followups" OWNER TO "postgres";


COMMENT ON TABLE "public"."lead_followups" IS 'Stores all follow-up interactions with leads, including scheduled, completed, and cancelled follow-ups';



CREATE SEQUENCE IF NOT EXISTS "public"."lead_followups_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."lead_followups_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lead_followups_id_seq" OWNED BY "public"."lead_followups"."id";



CREATE TABLE IF NOT EXISTS "public"."lead_sources" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_sources" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."lead_sources_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."lead_sources_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lead_sources_id_seq" OWNED BY "public"."lead_sources"."id";



CREATE TABLE IF NOT EXISTS "public"."lead_task_performance" (
    "id" integer NOT NULL,
    "lead_id" integer NOT NULL,
    "task_id" integer NOT NULL,
    "response_time_hours" numeric(10,2),
    "completion_time_hours" numeric(10,2),
    "sla_met" boolean,
    "revenue_impact" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_task_performance" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."lead_task_performance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."lead_task_performance_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lead_task_performance_id_seq" OWNED BY "public"."lead_task_performance"."id";



CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" integer NOT NULL,
    "lead_number" character varying(20) NOT NULL,
    "company_id" integer NOT NULL,
    "branch_id" integer,
    "client_name" character varying(255) NOT NULL,
    "email" character varying(255),
    "country_code" character varying(10),
    "phone" character varying(20),
    "is_whatsapp" boolean DEFAULT false,
    "has_separate_whatsapp" boolean DEFAULT false,
    "whatsapp_country_code" character varying(10),
    "whatsapp_number" character varying(20),
    "notes" "text",
    "status" character varying(50) DEFAULT 'UNASSIGNED'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "assigned_to" integer,
    "lead_source" character varying(100),
    "location" character varying(255),
    "lead_source_id" integer,
    "rejection_reason" "text",
    "rejected_at" timestamp with time zone,
    "rejected_by" "uuid",
    "rejected_by_employee_id" character varying(50),
    "assigned_to_uuid" "uuid",
    "previous_assigned_to" integer,
    "reassignment_date" timestamp with time zone,
    "reassignment_reason" character varying(50),
    "is_reassigned" boolean DEFAULT false,
    "reassigned_at" timestamp with time zone,
    "reassigned_by" integer,
    "reassigned_from_company_id" integer,
    "reassigned_from_branch_id" integer,
    "bride_name" "text",
    "groom_name" "text"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


COMMENT ON COLUMN "public"."leads"."rejected_by_employee_id" IS 'Employee ID of the user who rejected the lead';



CREATE SEQUENCE IF NOT EXISTS "public"."leads_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."leads_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."leads_id_seq" OWNED BY "public"."leads"."id";



CREATE TABLE IF NOT EXISTS "public"."management_insights" (
    "id" integer NOT NULL,
    "insight_type" "text" NOT NULL,
    "employee_id" "text",
    "priority" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "key_metrics" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "suggested_questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "recommended_actions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "confidence_score" numeric(5,4) NOT NULL,
    "is_addressed" boolean DEFAULT false NOT NULL,
    "addressed_at" timestamp with time zone,
    "addressed_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "management_insights_insight_type_check" CHECK (("insight_type" = ANY (ARRAY['team_performance'::"text", 'individual_performance'::"text", 'process_improvement'::"text", 'coaching_opportunity'::"text", 'recognition_suggestion'::"text", 'concern_alert'::"text"]))),
    CONSTRAINT "management_insights_priority_check" CHECK (("priority" = ANY (ARRAY['urgent'::"text", 'high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."management_insights" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."management_insights_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."management_insights_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."management_insights_id_seq" OWNED BY "public"."management_insights"."id";



CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" integer NOT NULL,
    "parent_id" integer,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50),
    "path" character varying(255),
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."menu_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."menu_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."menu_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."menu_items_id_seq" OWNED BY "public"."menu_items"."id";



CREATE TABLE IF NOT EXISTS "public"."menu_items_tracking" (
    "id" integer NOT NULL,
    "menu_item_id" integer NOT NULL,
    "last_known_state" "jsonb" NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menu_items_tracking" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."menu_items_tracking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."menu_items_tracking_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."menu_items_tracking_id_seq" OWNED BY "public"."menu_items_tracking"."id";



CREATE TABLE IF NOT EXISTS "public"."ml_model_performance" (
    "id" integer NOT NULL,
    "model_name" "text" NOT NULL,
    "model_version" "text" NOT NULL,
    "metric_type" "text" NOT NULL,
    "metric_value" numeric(8,6) NOT NULL,
    "dataset_size" integer NOT NULL,
    "training_date" timestamp with time zone NOT NULL,
    "evaluation_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_production_model" boolean DEFAULT false NOT NULL,
    CONSTRAINT "ml_model_performance_metric_type_check" CHECK (("metric_type" = ANY (ARRAY['accuracy'::"text", 'precision'::"text", 'recall'::"text", 'f1_score'::"text", 'auc_roc'::"text", 'mae'::"text", 'rmse'::"text"])))
);


ALTER TABLE "public"."ml_model_performance" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ml_model_performance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ml_model_performance_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ml_model_performance_id_seq" OWNED BY "public"."ml_model_performance"."id";



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" integer NOT NULL,
    "title" character varying(255),
    "description" "text",
    "department_id" integer,
    "responsibilities" "text"[],
    "required_skills" "text"[],
    "is_management" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_system_role" boolean DEFAULT false,
    "is_admin" boolean DEFAULT false,
    "name" "text" DEFAULT 'Unnamed Role'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_accounts" (
    "id" integer NOT NULL,
    "employee_id" integer NOT NULL,
    "role_id" integer NOT NULL,
    "username" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_login" timestamp without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_accounts" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."mv_user_roles_fast" AS
 SELECT "ua"."id" AS "user_id",
    "ua"."email",
    "ua"."username",
    "ua"."password_hash",
    "ua"."role_id",
    "r"."title" AS "role_name",
    "r"."permissions" AS "role_permissions",
        CASE
            WHEN (("r"."title")::"text" = 'Administrator'::"text") THEN true
            ELSE false
        END AS "is_admin",
    "ua"."created_at",
    "ua"."updated_at"
   FROM ("public"."user_accounts" "ua"
     LEFT JOIN "public"."roles" "r" ON (("ua"."role_id" = "r"."id")))
  WITH NO DATA;


ALTER TABLE "public"."mv_user_roles_fast" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_batches" (
    "id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "notification_type" character varying(100) NOT NULL,
    "batch_key" character varying(200) NOT NULL,
    "last_sent" timestamp with time zone DEFAULT "now"(),
    "count" integer DEFAULT 1,
    "metadata" "jsonb"
);


ALTER TABLE "public"."notification_batches" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notification_batches_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."notification_batches_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notification_batches_id_seq" OWNED BY "public"."notification_batches"."id";



CREATE TABLE IF NOT EXISTS "public"."notification_engagement" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notification_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "engagement_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_engagement_event_type_check" CHECK (("event_type" = ANY (ARRAY['delivered'::"text", 'viewed'::"text", 'clicked'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."notification_engagement" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "frequency" integer DEFAULT 1,
    "engagement_rate" numeric(3,2) DEFAULT 0.5,
    "optimal_timing" integer[] DEFAULT ARRAY[9, 14, 16],
    "user_segments" "text"[] DEFAULT ARRAY['general'::"text"],
    "success_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "text" NOT NULL,
    "user_id" integer NOT NULL,
    "type" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "quotation_id" integer,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "action_url" "text",
    "action_label" "text",
    "metadata" "jsonb",
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    "ai_enhanced" boolean DEFAULT false,
    "recipient_role" character varying(50),
    "recipient_id" integer,
    "data" "jsonb",
    "read_at" timestamp with time zone,
    CONSTRAINT "chk_notifications_priority" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "chk_notifications_user_id_positive" CHECK (("user_id" > 0)),
    CONSTRAINT "notifications_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['overdue'::"text", 'approval_needed'::"text", 'payment_received'::"text", 'client_followup'::"text", 'automation'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."notification_performance_metrics" AS
 SELECT "n"."type",
    "n"."priority",
    "count"(*) AS "total_sent",
    "count"(
        CASE
            WHEN ("ne"."event_type" = 'viewed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "total_viewed",
    "count"(
        CASE
            WHEN ("ne"."event_type" = 'clicked'::"text") THEN 1
            ELSE NULL::integer
        END) AS "total_clicked",
    "count"(
        CASE
            WHEN ("ne"."event_type" = 'dismissed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "total_dismissed",
    "round"(((("count"(
        CASE
            WHEN ("ne"."event_type" = 'viewed'::"text") THEN 1
            ELSE NULL::integer
        END))::numeric / ("count"(*))::numeric) * (100)::numeric), 2) AS "view_rate",
    "round"(((("count"(
        CASE
            WHEN ("ne"."event_type" = 'clicked'::"text") THEN 1
            ELSE NULL::integer
        END))::numeric / ("count"(*))::numeric) * (100)::numeric), 2) AS "click_rate",
    "avg"(EXTRACT(epoch FROM ("ne"."created_at" - "n"."created_at"))) AS "avg_response_time"
   FROM ("public"."notifications" "n"
     LEFT JOIN "public"."notification_engagement" "ne" ON (("n"."id" = "ne"."notification_id")))
  WHERE ("n"."created_at" >= ("now"() - '30 days'::interval))
  GROUP BY "n"."type", "n"."priority";


ALTER TABLE "public"."notification_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "permission_changes" boolean DEFAULT true,
    "role_assignments" boolean DEFAULT true,
    "admin_role_changes" boolean DEFAULT true,
    "security_permission_changes" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_recipients" (
    "notification_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_read" boolean DEFAULT false,
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."notification_recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_rules" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "recipients" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "template_id" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_by" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_rules_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['overdue'::"text", 'approval_needed'::"text", 'payment_received'::"text", 'client_followup'::"text", 'automation'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notification_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "user_id" integer NOT NULL,
    "email_enabled" boolean DEFAULT true NOT NULL,
    "in_app_enabled" boolean DEFAULT true NOT NULL,
    "overdue_alerts" boolean DEFAULT true NOT NULL,
    "approval_alerts" boolean DEFAULT true NOT NULL,
    "payment_alerts" boolean DEFAULT true NOT NULL,
    "automation_alerts" boolean DEFAULT true NOT NULL,
    "email_frequency" "text" DEFAULT 'immediate'::"text" NOT NULL,
    "quiet_hours_start" time without time zone,
    "quiet_hours_end" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_settings_email_frequency_check" CHECK (("email_frequency" = ANY (ARRAY['immediate'::"text", 'daily'::"text", 'weekly'::"text"])))
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "contact_person" character varying(200),
    "email" character varying(255),
    "phone" character varying(50),
    "address" "text",
    "partnership_type" character varying(100),
    "partnership_start_date" "date",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."partners_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."partners_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."partners_id_seq" OWNED BY "public"."partners"."id";



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" integer NOT NULL,
    "quotation_id" integer,
    "amount" numeric(12,2) NOT NULL,
    "payment_type" character varying(20) NOT NULL,
    "payment_method" character varying(50) NOT NULL,
    "payment_reference" character varying(100) NOT NULL,
    "paid_by" character varying(255) NOT NULL,
    "status" character varying(20) DEFAULT 'received'::character varying,
    "received_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_payment_type_check" CHECK ((("payment_type")::"text" = ANY ((ARRAY['advance'::character varying, 'partial'::character varying, 'full'::character varying])::"text"[])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."payments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."payments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."payments_id_seq" OWNED BY "public"."payments"."id";



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100) NOT NULL,
    "resource" character varying(100),
    "action" character varying(100),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" character varying(50) DEFAULT 'active'::character varying
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."permissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."permissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."permissions_id_seq" OWNED BY "public"."permissions"."id";



CREATE TABLE IF NOT EXISTS "public"."personalization_learning" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_data" "jsonb" NOT NULL,
    "outcome_positive" boolean,
    "learning_weight" numeric(3,2) DEFAULT 1.0,
    "context_tags" "text"[] DEFAULT '{}'::"text"[],
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personalization_learning" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_sale_confirmations" (
    "id" integer NOT NULL,
    "quotation_id" integer NOT NULL,
    "confirmed_by_user_id" "uuid" NOT NULL,
    "confirmation_date" timestamp without time zone DEFAULT "now"() NOT NULL,
    "call_date" "date" NOT NULL,
    "call_time" time without time zone NOT NULL,
    "call_duration" integer DEFAULT 30 NOT NULL,
    "client_contact_person" character varying(255) NOT NULL,
    "confirmation_method" character varying(50) DEFAULT 'phone'::character varying NOT NULL,
    "services_confirmed" "jsonb" DEFAULT '[]'::"jsonb",
    "deliverables_confirmed" "jsonb" DEFAULT '[]'::"jsonb",
    "event_details_confirmed" "jsonb" DEFAULT '{}'::"jsonb",
    "client_satisfaction_rating" integer DEFAULT 5,
    "client_expectations" "text" NOT NULL,
    "client_concerns" "text",
    "additional_requests" "text",
    "call_summary" "text" NOT NULL,
    "action_items" "text",
    "follow_up_required" boolean DEFAULT false,
    "follow_up_date" "date",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "post_sale_confirmations_client_satisfaction_rating_check" CHECK ((("client_satisfaction_rating" >= 1) AND ("client_satisfaction_rating" <= 5)))
);


ALTER TABLE "public"."post_sale_confirmations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."post_sale_confirmations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."post_sale_confirmations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."post_sale_confirmations_id_seq" OWNED BY "public"."post_sale_confirmations"."id";



CREATE TABLE IF NOT EXISTS "public"."post_sales_workflows" (
    "id" integer NOT NULL,
    "quotation_id" integer,
    "payment_id" integer,
    "instruction_id" integer,
    "client_name" character varying(255) NOT NULL,
    "status" character varying(30) DEFAULT 'pending_confirmation'::character varying,
    "instructions" "jsonb",
    "confirmed_by" character varying(255),
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_sales_workflows" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."post_sales_workflows_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."post_sales_workflows_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."post_sales_workflows_id_seq" OWNED BY "public"."post_sales_workflows"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" character varying(255),
    "avatar_url" "text",
    "job_title" character varying(255),
    "department" character varying(255),
    "location" character varying(255),
    "phone" character varying(50),
    "bio" "text",
    "employee_id" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."query_performance_logs" (
    "id" integer NOT NULL,
    "view_name" "text",
    "rows_returned" integer,
    "execution_time_ms" double precision,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."query_performance_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."query_performance_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."query_performance_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."query_performance_logs_id_seq" OWNED BY "public"."query_performance_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."quotation_approvals" (
    "id" integer NOT NULL,
    "quotation_id" integer,
    "approver_user_id" "uuid",
    "approval_status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "approval_date" timestamp without time zone,
    "comments" "text",
    "price_adjustments" "jsonb",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "valid_approval_status" CHECK ((("approval_status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."quotation_approvals" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotation_approvals" IS 'Tracks approval workflow for quotations including Sales Head approvals';



CREATE SEQUENCE IF NOT EXISTS "public"."quotation_approvals_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quotation_approvals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quotation_approvals_id_seq" OWNED BY "public"."quotation_approvals"."id";



CREATE TABLE IF NOT EXISTS "public"."quotation_events" (
    "id" integer NOT NULL,
    "quotation_id" integer,
    "event_name" character varying(255) NOT NULL,
    "event_date" timestamp with time zone NOT NULL,
    "event_location" character varying(255) NOT NULL,
    "venue_name" character varying(255) NOT NULL,
    "start_time" character varying(10) NOT NULL,
    "end_time" character varying(10) NOT NULL,
    "expected_crowd" character varying(100),
    "selected_package" character varying(20) NOT NULL,
    "selected_services" "jsonb" DEFAULT '[]'::"jsonb",
    "selected_deliverables" "jsonb" DEFAULT '[]'::"jsonb",
    "service_overrides" "jsonb" DEFAULT '{}'::"jsonb",
    "package_overrides" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quotation_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quotation_events_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quotation_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quotation_events_id_seq" OWNED BY "public"."quotation_events"."id";



CREATE TABLE IF NOT EXISTS "public"."quotation_predictions" (
    "id" integer NOT NULL,
    "quotation_id" integer NOT NULL,
    "success_probability" numeric(5,4) NOT NULL,
    "confidence_score" numeric(5,4) NOT NULL,
    "prediction_factors" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "model_version" "text" DEFAULT 'v1.0'::"text" NOT NULL,
    "predicted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actual_outcome" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "quotation_predictions_actual_outcome_check" CHECK (("actual_outcome" = ANY (ARRAY['won'::"text", 'lost'::"text", 'pending'::"text", NULL::"text"])))
);


ALTER TABLE "public"."quotation_predictions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quotation_predictions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quotation_predictions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quotation_predictions_id_seq" OWNED BY "public"."quotation_predictions"."id";



CREATE TABLE IF NOT EXISTS "public"."quotation_revisions" (
    "id" integer NOT NULL,
    "original_quotation_id" integer,
    "revision_number" integer NOT NULL,
    "revised_quotation_data" "jsonb" NOT NULL,
    "revision_reason" "text" NOT NULL,
    "revised_by" character varying(255) NOT NULL,
    "status" character varying(20) DEFAULT 'pending_approval'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quotation_revisions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quotation_revisions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quotation_revisions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quotation_revisions_id_seq" OWNED BY "public"."quotation_revisions"."id";



CREATE TABLE IF NOT EXISTS "public"."quotation_workflow_history" (
    "id" integer NOT NULL,
    "quotation_id" integer NOT NULL,
    "action" character varying(50) NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "performed_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "comments" "text"
);


ALTER TABLE "public"."quotation_workflow_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quotation_workflow_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quotation_workflow_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quotation_workflow_history_id_seq" OWNED BY "public"."quotation_workflow_history"."id";



CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" integer NOT NULL,
    "lead_id" integer,
    "follow_up_id" integer,
    "quotation_number" character varying(50) NOT NULL,
    "client_name" character varying(255) NOT NULL,
    "bride_name" character varying(255) NOT NULL,
    "groom_name" character varying(255) NOT NULL,
    "mobile" character varying(50) NOT NULL,
    "whatsapp" character varying(50),
    "alternate_mobile" character varying(50),
    "alternate_whatsapp" character varying(50),
    "email" character varying(255) NOT NULL,
    "default_package" character varying(20) NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "created_by" "uuid" NOT NULL,
    "quotation_data" "jsonb" NOT NULL,
    "events_count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text",
    "workflow_status" character varying(50) DEFAULT 'draft'::character varying,
    "client_verbal_confirmation_date" timestamp without time zone,
    "payment_received_date" timestamp without time zone,
    "payment_amount" numeric(12,2),
    "payment_reference" character varying(100),
    "confirmation_required" boolean DEFAULT true,
    CONSTRAINT "quotations_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying])::"text"[]))),
    CONSTRAINT "valid_workflow_status" CHECK ((("workflow_status")::"text" = ANY ((ARRAY['draft'::character varying, 'pending_client_confirmation'::character varying, 'pending_approval'::character varying, 'approved'::character varying, 'payment_received'::character varying, 'confirmed'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quotations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quotations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quotations_id_seq" OWNED BY "public"."quotations"."id";



CREATE TABLE IF NOT EXISTS "public"."quote_components" (
    "id" integer NOT NULL,
    "quote_id" integer NOT NULL,
    "component_type" character varying(50) NOT NULL,
    "component_name" character varying(255) NOT NULL,
    "component_description" "text",
    "unit_price" numeric(10,2),
    "quantity" integer DEFAULT 1,
    "subtotal" numeric(10,2) NOT NULL,
    "metadata" "jsonb",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_component_type" CHECK ((("component_type")::"text" = ANY ((ARRAY['service'::character varying, 'deliverable'::character varying, 'addon'::character varying, 'discount'::character varying, 'custom'::character varying])::"text"[])))
);


ALTER TABLE "public"."quote_components" OWNER TO "postgres";


COMMENT ON TABLE "public"."quote_components" IS 'Flexible quote components for future extensions';



CREATE SEQUENCE IF NOT EXISTS "public"."quote_components_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quote_components_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quote_components_id_seq" OWNED BY "public"."quote_components"."id";



CREATE TABLE IF NOT EXISTS "public"."quote_deliverables_snapshot" (
    "id" integer NOT NULL,
    "quote_id" integer NOT NULL,
    "deliverable_id" integer NOT NULL,
    "deliverable_name" character varying(255) NOT NULL,
    "deliverable_type" character varying(50) NOT NULL,
    "process_name" character varying(255) NOT NULL,
    "package_type" character varying(20) NOT NULL,
    "tat" integer,
    "timing_type" character varying(20),
    "sort_order" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_deliverable_package_type" CHECK ((("package_type")::"text" = ANY ((ARRAY['basic'::character varying, 'premium'::character varying, 'elite'::character varying])::"text"[])))
);


ALTER TABLE "public"."quote_deliverables_snapshot" OWNER TO "postgres";


COMMENT ON TABLE "public"."quote_deliverables_snapshot" IS 'Deliverables snapshot for quotes';



CREATE SEQUENCE IF NOT EXISTS "public"."quote_deliverables_snapshot_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quote_deliverables_snapshot_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quote_deliverables_snapshot_id_seq" OWNED BY "public"."quote_deliverables_snapshot"."id";



CREATE TABLE IF NOT EXISTS "public"."quote_services_snapshot" (
    "id" integer NOT NULL,
    "quote_id" integer NOT NULL,
    "service_id" integer NOT NULL,
    "service_name" character varying(255) NOT NULL,
    "package_type" character varying(20) NOT NULL,
    "locked_price" numeric(10,2) NOT NULL,
    "quantity" integer DEFAULT 1,
    "subtotal" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_package_type" CHECK ((("package_type")::"text" = ANY ((ARRAY['basic'::character varying, 'premium'::character varying, 'elite'::character varying])::"text"[])))
);


ALTER TABLE "public"."quote_services_snapshot" OWNER TO "postgres";


COMMENT ON TABLE "public"."quote_services_snapshot" IS 'Price-locked services for quotes';



CREATE SEQUENCE IF NOT EXISTS "public"."quote_services_snapshot_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."quote_services_snapshot_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quote_services_snapshot_id_seq" OWNED BY "public"."quote_services_snapshot"."id";



CREATE OR REPLACE VIEW "public"."recent_business_notifications" AS
 SELECT "n"."id",
    "n"."user_id",
    "n"."type",
    "n"."priority",
    "n"."title",
    "n"."message",
    "n"."quotation_id",
    "n"."is_read",
    "n"."created_at",
    "n"."expires_at",
    "n"."action_url",
    "n"."action_label",
    "n"."metadata",
    (EXTRACT(epoch FROM ("now"() - "n"."created_at")) / (60)::numeric) AS "minutes_ago"
   FROM "public"."notifications" "n"
  WHERE ((("n"."metadata" ->> 'business_event'::"text") = 'true'::"text") AND ("n"."created_at" >= ("now"() - '24:00:00'::interval)))
  ORDER BY "n"."created_at" DESC;


ALTER TABLE "public"."recent_business_notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."rejected_leads_view" AS
 SELECT "l"."id",
    "l"."lead_number",
    "l"."client_name",
    "l"."status",
    "l"."company_id",
    "l"."branch_id",
    "l"."created_at",
    "l"."updated_at",
    "c"."name" AS "company_name",
    "b"."name" AS "branch_name",
    COALESCE("l"."rejection_reason", "a"."description", 'No reason provided'::"text") AS "rejection_details",
    COALESCE("l"."rejected_at", "a"."created_at", "l"."updated_at") AS "rejection_timestamp",
    COALESCE(("l"."rejected_by")::"text", ("a"."user_name")::"text") AS "rejection_user"
   FROM ((("public"."leads" "l"
     LEFT JOIN "public"."companies" "c" ON (("l"."company_id" = "c"."id")))
     LEFT JOIN "public"."branches" "b" ON (("l"."branch_id" = "b"."id")))
     LEFT JOIN ( SELECT DISTINCT ON ("activities"."entity_id") "activities"."entity_id",
            "activities"."description",
            "activities"."created_at",
            "activities"."user_name"
           FROM "public"."activities"
          WHERE (("activities"."action_type")::"text" = 'reject'::"text")
          ORDER BY "activities"."entity_id", "activities"."created_at" DESC) "a" ON ((("l"."id")::"text" = "a"."entity_id")))
  WHERE (("l"."status")::"text" = 'REJECTED'::"text");


ALTER TABLE "public"."rejected_leads_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revenue_forecasts" (
    "id" integer NOT NULL,
    "forecast_period" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "predicted_revenue" numeric(15,2) NOT NULL,
    "confidence_interval_low" numeric(15,2) NOT NULL,
    "confidence_interval_high" numeric(15,2) NOT NULL,
    "contributing_factors" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "model_metrics" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "actual_revenue" numeric(15,2),
    "forecast_accuracy" numeric(5,4),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."revenue_forecasts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."revenue_forecasts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."revenue_forecasts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."revenue_forecasts_id_seq" OWNED BY "public"."revenue_forecasts"."id";



CREATE TABLE IF NOT EXISTS "public"."role_menu_permissions" (
    "id" integer NOT NULL,
    "role_id" integer NOT NULL,
    "menu_item_id" integer NOT NULL,
    "can_view" boolean DEFAULT false,
    "can_add" boolean DEFAULT false,
    "can_edit" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" "uuid",
    "updated_by" "uuid",
    "description" "text"
);


ALTER TABLE "public"."role_menu_permissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."role_menu_permissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."role_menu_permissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."role_menu_permissions_id_seq" OWNED BY "public"."role_menu_permissions"."id";



CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" integer NOT NULL,
    "role_id" integer,
    "permission_id" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" character varying(50) DEFAULT 'active'::character varying
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."role_permissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."role_permissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."role_permissions_id_seq" OWNED BY "public"."role_permissions"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";



CREATE TABLE IF NOT EXISTS "public"."sales_activities" (
    "id" integer NOT NULL,
    "employee_id" "text" NOT NULL,
    "quotation_id" integer,
    "activity_type" "text" NOT NULL,
    "activity_description" "text" NOT NULL,
    "activity_outcome" "text",
    "time_spent_minutes" integer DEFAULT 0,
    "activity_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "client_name" "text",
    "deal_value" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sales_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['quotation_created'::"text", 'quotation_sent'::"text", 'follow_up_call'::"text", 'follow_up_email'::"text", 'client_meeting'::"text", 'site_visit'::"text", 'proposal_revision'::"text", 'negotiation'::"text", 'contract_signed'::"text", 'deal_lost'::"text", 'client_referral'::"text"])))
);


ALTER TABLE "public"."sales_activities" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_activities_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sales_activities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_activities_id_seq" OWNED BY "public"."sales_activities"."id";



CREATE TABLE IF NOT EXISTS "public"."sales_performance_metrics" (
    "id" integer NOT NULL,
    "employee_id" "text" NOT NULL,
    "metric_period" "date" NOT NULL,
    "quotations_created" integer DEFAULT 0 NOT NULL,
    "quotations_converted" integer DEFAULT 0 NOT NULL,
    "total_revenue_generated" numeric(15,2) DEFAULT 0 NOT NULL,
    "avg_deal_size" numeric(15,2) DEFAULT 0 NOT NULL,
    "avg_conversion_time_days" integer DEFAULT 0 NOT NULL,
    "follow_ups_completed" integer DEFAULT 0 NOT NULL,
    "client_meetings_held" integer DEFAULT 0 NOT NULL,
    "calls_made" integer DEFAULT 0 NOT NULL,
    "emails_sent" integer DEFAULT 0 NOT NULL,
    "conversion_rate" numeric(5,4) DEFAULT 0 NOT NULL,
    "activity_score" numeric(5,2) DEFAULT 0 NOT NULL,
    "performance_score" numeric(5,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_performance_metrics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_performance_metrics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sales_performance_metrics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_performance_metrics_id_seq" OWNED BY "public"."sales_performance_metrics"."id";



CREATE TABLE IF NOT EXISTS "public"."sales_team_members" (
    "id" integer NOT NULL,
    "employee_id" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "text" NOT NULL,
    "hire_date" "date" NOT NULL,
    "territory" "text",
    "target_monthly" numeric(15,2) DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sales_team_members_role_check" CHECK (("role" = ANY (ARRAY['sales_rep'::"text", 'senior_sales_rep'::"text", 'sales_manager'::"text", 'sales_head'::"text"])))
);


ALTER TABLE "public"."sales_team_members" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_team_members_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sales_team_members_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_team_members_id_seq" OWNED BY "public"."sales_team_members"."id";



CREATE TABLE IF NOT EXISTS "public"."sequence_rules" (
    "id" integer NOT NULL,
    "sequence_template_id" integer,
    "rule_type" character varying(100) NOT NULL,
    "condition_field" character varying(100) NOT NULL,
    "condition_operator" character varying(20) NOT NULL,
    "condition_value" "text" NOT NULL,
    "action_type" character varying(100) NOT NULL,
    "action_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sequence_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."sequence_rules" IS 'Conditional rules that modify sequence behavior';



CREATE SEQUENCE IF NOT EXISTS "public"."sequence_rules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sequence_rules_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sequence_rules_id_seq" OWNED BY "public"."sequence_rules"."id";



CREATE TABLE IF NOT EXISTS "public"."sequence_steps" (
    "id" integer NOT NULL,
    "sequence_template_id" integer,
    "step_number" integer NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "icon" character varying(50) DEFAULT 'target'::character varying,
    "due_after_hours" integer DEFAULT 24,
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "is_conditional" boolean DEFAULT false,
    "condition_type" character varying(100),
    "condition_value" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sequence_steps" OWNER TO "postgres";


COMMENT ON TABLE "public"."sequence_steps" IS 'Individual steps within task sequences';



CREATE SEQUENCE IF NOT EXISTS "public"."sequence_steps_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sequence_steps_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sequence_steps_id_seq" OWNED BY "public"."sequence_steps"."id";



CREATE TABLE IF NOT EXISTS "public"."service_packages" (
    "id" integer NOT NULL,
    "package_name" character varying(50) NOT NULL,
    "package_display_name" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_package_name" CHECK ((("package_name")::"text" = ANY ((ARRAY['basic'::character varying, 'premium'::character varying, 'elite'::character varying])::"text"[])))
);


ALTER TABLE "public"."service_packages" OWNER TO "postgres";


COMMENT ON TABLE "public"."service_packages" IS 'Package definitions (Basic, Premium, Elite)';



CREATE SEQUENCE IF NOT EXISTS "public"."service_packages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."service_packages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."service_packages_id_seq" OWNED BY "public"."service_packages"."id";



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" integer NOT NULL,
    "servicename" character varying(255) NOT NULL,
    "status" character varying(50) DEFAULT 'Active'::character varying NOT NULL,
    "description" "text",
    "category" character varying(100),
    "price" numeric(10,2),
    "unit" character varying(50),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "basic_price" numeric(10,2),
    "premium_price" numeric(10,2),
    "elite_price" numeric(10,2),
    "package_included" "jsonb" DEFAULT '{"basic": false, "elite": false, "premium": false}'::"jsonb"
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."services_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."services_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."services_id_seq" OWNED BY "public"."services"."id";



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" integer NOT NULL,
    "supplier_code" character varying(20) NOT NULL,
    "name" character varying(100) NOT NULL,
    "contact_person" character varying(100) NOT NULL,
    "email" character varying(100) NOT NULL,
    "phone" character varying(20) NOT NULL,
    "address" "text" NOT NULL,
    "city" character varying(50) NOT NULL,
    "state" character varying(50) NOT NULL,
    "postal_code" character varying(20) NOT NULL,
    "country" character varying(50) NOT NULL,
    "category" character varying(50) NOT NULL,
    "tax_id" character varying(50),
    "payment_terms" character varying(100),
    "website" character varying(255),
    "notes" "text",
    "status" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "lead_time" character varying(100),
    CONSTRAINT "suppliers_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'blacklisted'::character varying])::"text"[])))
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."suppliers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."suppliers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."suppliers_id_seq" OWNED BY "public"."suppliers"."id";



CREATE TABLE IF NOT EXISTS "public"."system_logs" (
    "id" integer NOT NULL,
    "action" character varying(100) NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."system_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."system_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."system_logs_id_seq" OWNED BY "public"."system_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."task_generation_log" (
    "id" integer NOT NULL,
    "lead_id" integer,
    "quotation_id" integer,
    "rule_triggered" character varying(100) NOT NULL,
    "task_id" integer,
    "success" boolean NOT NULL,
    "error_message" "text",
    "triggered_by" character varying(100),
    "triggered_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."task_generation_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."task_generation_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."task_generation_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."task_generation_log_id_seq" OWNED BY "public"."task_generation_log"."id";



CREATE TABLE IF NOT EXISTS "public"."task_performance_metrics" (
    "id" integer NOT NULL,
    "task_id" integer NOT NULL,
    "lead_id" integer,
    "quotation_id" integer,
    "assigned_to" integer,
    "created_date" "date" NOT NULL,
    "due_date" "date",
    "completed_date" "date",
    "days_to_complete" integer,
    "hours_estimated" numeric(5,2),
    "hours_actual" numeric(5,2),
    "efficiency_ratio" numeric(5,2),
    "priority_level" character varying(20),
    "was_overdue" boolean DEFAULT false,
    "quality_rating" integer,
    "revenue_impact" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "task_performance_metrics_quality_rating_check" CHECK ((("quality_rating" >= 1) AND ("quality_rating" <= 5)))
);


ALTER TABLE "public"."task_performance_metrics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."task_performance_metrics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."task_performance_metrics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."task_performance_metrics_id_seq" OWNED BY "public"."task_performance_metrics"."id";



CREATE TABLE IF NOT EXISTS "public"."task_sequence_templates" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100) DEFAULT 'sales_followup'::character varying,
    "is_active" boolean DEFAULT true,
    "created_by" character varying(100) DEFAULT 'Admin'::character varying,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_sequence_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."task_sequence_templates" IS 'Master templates for automated task sequences';



CREATE SEQUENCE IF NOT EXISTS "public"."task_sequence_templates_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."task_sequence_templates_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."task_sequence_templates_id_seq" OWNED BY "public"."task_sequence_templates"."id";



CREATE TABLE IF NOT EXISTS "public"."task_status_history" (
    "id" integer NOT NULL,
    "task_id" integer NOT NULL,
    "from_status" character varying(20),
    "to_status" character varying(20) NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "changed_by" character varying(100),
    "notes" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_status_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."task_status_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."task_status_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."task_status_history_id_seq" OWNED BY "public"."task_status_history"."id";



CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" integer NOT NULL,
    "employee_id" integer NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_performance_trends" (
    "id" integer NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "total_quotations" integer DEFAULT 0 NOT NULL,
    "total_conversions" integer DEFAULT 0 NOT NULL,
    "total_revenue" numeric(15,2) DEFAULT 0 NOT NULL,
    "team_conversion_rate" numeric(5,4) DEFAULT 0 NOT NULL,
    "avg_deal_size" numeric(15,2) DEFAULT 0 NOT NULL,
    "avg_sales_cycle_days" integer DEFAULT 0 NOT NULL,
    "top_performer_id" "text",
    "underperformer_id" "text",
    "performance_variance" numeric(8,4) DEFAULT 0 NOT NULL,
    "team_activity_score" numeric(5,2) DEFAULT 0 NOT NULL,
    "coaching_opportunities" integer DEFAULT 0 NOT NULL,
    "process_improvements_needed" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_performance_trends" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."team_performance_trends_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."team_performance_trends_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."team_performance_trends_id_seq" OWNED BY "public"."team_performance_trends"."id";



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "department_id" integer,
    "team_lead_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."teams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."teams_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teams_id_seq" OWNED BY "public"."teams"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."user_accounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."user_accounts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_accounts_id_seq" OWNED BY "public"."user_accounts"."id";



CREATE TABLE IF NOT EXISTS "public"."user_activity_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "activity_data" "jsonb" DEFAULT '{}'::"jsonb",
    "session_id" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activity_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_ai_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "personality_type" "text" DEFAULT 'balanced'::"text",
    "communication_style" "text" DEFAULT 'formal'::"text",
    "preferred_content_length" "text" DEFAULT 'medium'::"text",
    "engagement_patterns" "jsonb" DEFAULT '{}'::"jsonb",
    "response_time_patterns" "jsonb" DEFAULT '{}'::"jsonb",
    "content_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_learning_enabled" boolean DEFAULT true,
    "personalization_score" numeric(3,2) DEFAULT 0.5,
    "last_interaction" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_ai_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_behavior_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "most_active_hours" integer[] DEFAULT ARRAY[9, 10, 14, 15, 16],
    "avg_response_time" integer DEFAULT 1800,
    "preferred_notification_types" "text"[] DEFAULT ARRAY['system'::"text"],
    "engagement_score" numeric(3,2) DEFAULT 0.5,
    "timezone" "text" DEFAULT 'UTC'::"text",
    "device_types" "text"[] DEFAULT ARRAY['web'::"text"],
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "total_notifications_received" integer DEFAULT 0,
    "total_notifications_read" integer DEFAULT 0,
    "average_read_time" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_behavior_analytics_engagement_score_check" CHECK ((("engagement_score" >= (0)::numeric) AND ("engagement_score" <= (1)::numeric)))
);


ALTER TABLE "public"."user_behavior_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_engagement_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_id" "text",
    "engagement_type" "text" NOT NULL,
    "engagement_value" numeric(5,2) DEFAULT 1.0,
    "channel" "text" NOT NULL,
    "device_type" "text",
    "time_to_engage" integer,
    "context_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_engagement_analytics_engagement_type_check" CHECK (("engagement_type" = ANY (ARRAY['view'::"text", 'click'::"text", 'action'::"text", 'dismiss'::"text", 'share'::"text"])))
);


ALTER TABLE "public"."user_engagement_analytics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_engagement_summary" AS
 SELECT "uba"."user_id",
    "uba"."engagement_score",
    "uba"."total_notifications_received",
    "uba"."total_notifications_read",
    "round"(
        CASE
            WHEN ("uba"."total_notifications_received" > 0) THEN ((("uba"."total_notifications_read")::numeric / ("uba"."total_notifications_received")::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END, 2) AS "read_rate",
    "uba"."avg_response_time",
    "uba"."most_active_hours",
    "uba"."last_activity"
   FROM "public"."user_behavior_analytics" "uba";


ALTER TABLE "public"."user_engagement_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_id_mapping" (
    "numeric_id" integer NOT NULL,
    "uuid" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_id_mapping" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_menu_permissions" AS
 SELECT "ua"."id" AS "user_id",
    "ua"."username",
    "r"."id" AS "role_id",
    "r"."title" AS "role_title",
    "mi"."id" AS "menu_item_id",
    "mi"."name" AS "menu_name",
    "mi"."path" AS "menu_path",
    "mi"."parent_id",
    "mi"."icon",
    "mi"."is_visible",
    "rmp"."can_view",
    "rmp"."can_add",
    "rmp"."can_edit",
    "rmp"."can_delete"
   FROM ((("public"."user_accounts" "ua"
     JOIN "public"."roles" "r" ON (("ua"."role_id" = "r"."id")))
     JOIN "public"."role_menu_permissions" "rmp" ON (("r"."id" = "rmp"."role_id")))
     JOIN "public"."menu_items" "mi" ON (("rmp"."menu_item_id" = "mi"."id")))
  WHERE (("ua"."is_active" = true) AND ("mi"."is_visible" = true));


ALTER TABLE "public"."user_menu_permissions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_notification_summary" AS
 SELECT "notifications"."user_id",
    "count"(*) AS "total_notifications",
    "count"(*) FILTER (WHERE ("notifications"."is_read" = false)) AS "unread_count",
    "count"(*) FILTER (WHERE (("notifications"."priority" = 'urgent'::"text") AND ("notifications"."is_read" = false))) AS "urgent_unread",
    "count"(*) FILTER (WHERE (("notifications"."priority" = 'high'::"text") AND ("notifications"."is_read" = false))) AS "high_unread",
    "max"("notifications"."created_at") AS "latest_notification"
   FROM "public"."notifications"
  GROUP BY "notifications"."user_id";


ALTER TABLE "public"."user_notification_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text",
    "include_name" boolean DEFAULT false,
    "channel_preferences" "text"[] DEFAULT ARRAY['in_app'::"text"],
    "quiet_hours_start" integer DEFAULT 22,
    "quiet_hours_end" integer DEFAULT 8,
    "frequency_limit" integer DEFAULT 10,
    "ai_optimization_enabled" boolean DEFAULT true,
    "personalization_level" "text" DEFAULT 'medium'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_preferences_personalization_level_check" CHECK (("personalization_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."user_roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_roles_id_seq" OWNED BY "public"."user_roles"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" character varying(255) NOT NULL,
    "password" character varying(255) NOT NULL,
    "email" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "employee_id" character varying(50)
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."employee_id" IS 'Employee ID for the user';



CREATE OR REPLACE VIEW "public"."v_package_deliverables" AS
 SELECT "p"."package_name",
    "p"."package_display_name",
    "d"."id" AS "deliverable_id",
    "d"."deliverable_name",
    "d"."deliverable_type",
    "d"."process_name",
    "d"."tat",
    "d"."timing_type",
    "d"."sort_order",
    (("d"."package_included" ->> ("p"."package_name")::"text") = 'true'::"text") AS "is_included"
   FROM ("public"."service_packages" "p"
     CROSS JOIN "public"."deliverables" "d")
  WHERE ("d"."status" = 1)
  ORDER BY "p"."sort_order", "d"."deliverable_type", "d"."sort_order";


ALTER TABLE "public"."v_package_deliverables" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_package_services" AS
 SELECT "p"."package_name",
    "p"."package_display_name",
    "s"."id" AS "service_id",
    "s"."servicename",
    "s"."category",
        CASE
            WHEN (("p"."package_name")::"text" = 'basic'::"text") THEN "s"."basic_price"
            WHEN (("p"."package_name")::"text" = 'premium'::"text") THEN "s"."premium_price"
            WHEN (("p"."package_name")::"text" = 'elite'::"text") THEN "s"."elite_price"
            ELSE NULL::numeric
        END AS "package_price",
    (("s"."package_included" ->> ("p"."package_name")::"text") = 'true'::"text") AS "is_included"
   FROM ("public"."service_packages" "p"
     CROSS JOIN "public"."services" "s")
  WHERE (("s"."status")::"text" = 'Active'::"text")
  ORDER BY "p"."sort_order", "s"."servicename";


ALTER TABLE "public"."v_package_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" integer NOT NULL,
    "vendor_code" character varying(20) NOT NULL,
    "name" character varying(100) NOT NULL,
    "contact_person" character varying(100) NOT NULL,
    "email" character varying(100) NOT NULL,
    "phone" character varying(20) NOT NULL,
    "address" "text" NOT NULL,
    "city" character varying(50) NOT NULL,
    "state" character varying(50) NOT NULL,
    "postal_code" character varying(20) NOT NULL,
    "country" character varying(50) NOT NULL,
    "category" character varying(50) NOT NULL,
    "tax_id" character varying(50),
    "payment_terms" character varying(100),
    "website" character varying(255),
    "notes" "text",
    "status" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendors_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'blacklisted'::character varying])::"text"[])))
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."vendors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."vendors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vendors_id_seq" OWNED BY "public"."vendors"."id";



CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_phone_number_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "webhook_verify_token" "text" NOT NULL,
    "webhook_url" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."whatsapp_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" integer NOT NULL,
    "phone_number" "text" NOT NULL,
    "template_id" "uuid",
    "message_content" "text" NOT NULL,
    "message_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "notification_id" "text",
    "ai_timing_score" numeric(3,2),
    "ai_personalization_score" numeric(3,2),
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "whatsapp_messages_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'read'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."whatsapp_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_name" "text" NOT NULL,
    "template_type" "text" NOT NULL,
    "template_content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "language_code" "text" DEFAULT 'en'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "ai_optimized" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "whatsapp_templates_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "whatsapp_templates_template_type_check" CHECK (("template_type" = ANY (ARRAY['notification'::"text", 'marketing'::"text", 'follow_up'::"text", 'reminder'::"text"])))
);


ALTER TABLE "public"."whatsapp_templates" OWNER TO "postgres";


ALTER TABLE ONLY "audit_security"."audit_trail" ALTER COLUMN "id" SET DEFAULT "nextval"('"audit_security"."audit_trail_id_seq"'::"regclass");



ALTER TABLE ONLY "audit_security"."permissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"audit_security"."permissions_id_seq"'::"regclass");



ALTER TABLE ONLY "audit_security"."role_permissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"audit_security"."role_permissions_id_seq"'::"regclass");



ALTER TABLE ONLY "audit_security"."roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"audit_security"."roles_id_seq"'::"regclass");



ALTER TABLE ONLY "audit_security"."user_roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"audit_security"."user_roles_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."account_heads" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."account_heads_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."audio_genres" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."audio_genres_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."bank_accounts" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."bank_accounts_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."branches" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."branches_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."checklist_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."checklist_items_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."checklists" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."checklists_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."clients" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."clients_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."companies" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."companies_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."deliverables" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."deliverables_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."departments" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."departments_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."designations" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."designations_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."document_templates" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."document_templates_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."muhurtham" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."muhurtham_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."payment_modes" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."payment_modes_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."service_deliverable_mapping" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."service_deliverable_mapping_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."services" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."services_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."suppliers" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."suppliers_id_seq"'::"regclass");



ALTER TABLE ONLY "master_data"."vendors" ALTER COLUMN "id" SET DEFAULT "nextval"('"master_data"."vendors_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."accounting_workflows" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."accounting_workflows_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."action_recommendations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."action_recommendations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_behavior_settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_behavior_settings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_configurations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_configurations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_prompt_templates" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_prompt_templates_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_tasks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ai_tasks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."branches" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."branches_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."business_trends" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."business_trends_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."client_insights" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."client_insights_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."clients" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."clients_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."companies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."companies_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."deliverable_master" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."deliverable_master_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."deliverables" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."deliverables_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."department_instructions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."department_instructions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."departments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."departments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."designations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."designations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."employee_companies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."employee_companies_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."employees" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."employees_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."instruction_approvals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."instruction_approvals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lead_drafts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lead_drafts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lead_followups" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lead_followups_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lead_sources" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lead_sources_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lead_task_performance" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lead_task_performance_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."leads" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."leads_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."management_insights" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."management_insights_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."menu_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."menu_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."menu_items_tracking" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."menu_items_tracking_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ml_model_performance" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ml_model_performance_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notification_batches" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notification_batches_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."partners" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."partners_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."payments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."payments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."permissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."permissions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."post_sale_confirmations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."post_sale_confirmations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."post_sales_workflows" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."post_sales_workflows_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."query_performance_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."query_performance_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quotation_approvals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quotation_approvals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quotation_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quotation_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quotation_predictions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quotation_predictions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quotation_revisions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quotation_revisions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quotation_workflow_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quotation_workflow_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quotations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quotations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quote_components" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quote_components_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quote_deliverables_snapshot" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quote_deliverables_snapshot_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quote_services_snapshot" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."quote_services_snapshot_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."revenue_forecasts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."revenue_forecasts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."role_menu_permissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."role_menu_permissions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."role_permissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."role_permissions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales_activities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_activities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales_performance_metrics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_performance_metrics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales_team_members" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_team_members_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sequence_rules" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sequence_rules_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sequence_steps" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sequence_steps_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."service_packages" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."service_packages_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."services" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."services_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."suppliers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."suppliers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."system_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."system_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."task_generation_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."task_generation_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."task_performance_metrics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."task_performance_metrics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."task_sequence_templates" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."task_sequence_templates_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."task_status_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."task_status_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."team_performance_trends" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."team_performance_trends_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."teams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teams_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_accounts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_accounts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vendors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vendors_id_seq"'::"regclass");



ALTER TABLE ONLY "audit_security"."audit_trail"
    ADD CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "audit_security"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "audit_security"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "audit_security"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "audit_security"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."account_heads"
    ADD CONSTRAINT "account_heads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."audio_genres"
    ADD CONSTRAINT "audio_genres_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."branches"
    ADD CONSTRAINT "branches_code_key" UNIQUE ("code");



ALTER TABLE ONLY "master_data"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."checklist_items"
    ADD CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."checklists"
    ADD CONSTRAINT "checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."clients"
    ADD CONSTRAINT "clients_code_key" UNIQUE ("code");



ALTER TABLE ONLY "master_data"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."companies"
    ADD CONSTRAINT "companies_code_key" UNIQUE ("code");



ALTER TABLE ONLY "master_data"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."deliverables"
    ADD CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."departments"
    ADD CONSTRAINT "departments_code_key" UNIQUE ("code");



ALTER TABLE ONLY "master_data"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."designations"
    ADD CONSTRAINT "designations_code_key" UNIQUE ("code");



ALTER TABLE ONLY "master_data"."designations"
    ADD CONSTRAINT "designations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."document_templates"
    ADD CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."muhurtham"
    ADD CONSTRAINT "muhurtham_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."payment_modes"
    ADD CONSTRAINT "payment_modes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."service_deliverable_mapping"
    ADD CONSTRAINT "service_deliverable_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."service_deliverable_mapping"
    ADD CONSTRAINT "service_deliverable_mapping_service_id_deliverable_id_key" UNIQUE ("service_id", "deliverable_id");



ALTER TABLE ONLY "master_data"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."suppliers"
    ADD CONSTRAINT "suppliers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "master_data"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "master_data"."vendors"
    ADD CONSTRAINT "vendors_code_key" UNIQUE ("code");



ALTER TABLE ONLY "master_data"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounting_workflows"
    ADD CONSTRAINT "accounting_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."action_recommendations"
    ADD CONSTRAINT "action_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_behavior_settings"
    ADD CONSTRAINT "ai_behavior_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_behavior_settings"
    ADD CONSTRAINT "ai_behavior_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."ai_configurations"
    ADD CONSTRAINT "ai_configurations_config_key_key" UNIQUE ("config_key");



ALTER TABLE ONLY "public"."ai_configurations"
    ADD CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_contacts"
    ADD CONSTRAINT "ai_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_decision_log"
    ADD CONSTRAINT "ai_decision_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_performance_tracking"
    ADD CONSTRAINT "ai_performance_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_prompt_templates"
    ADD CONSTRAINT "ai_prompt_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_prompt_templates"
    ADD CONSTRAINT "ai_prompt_templates_template_name_key" UNIQUE ("template_name");



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_tasks"
    ADD CONSTRAINT "ai_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_cache"
    ADD CONSTRAINT "analytics_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."analytics_cache"
    ADD CONSTRAINT "analytics_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_metrics"
    ADD CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auditions"
    ADD CONSTRAINT "auditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bug_attachments"
    ADD CONSTRAINT "bug_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bug_comments"
    ADD CONSTRAINT "bug_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bugs"
    ADD CONSTRAINT "bugs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_trends"
    ADD CONSTRAINT "business_trends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_analytics"
    ADD CONSTRAINT "call_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_insights"
    ADD CONSTRAINT "call_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_transcriptions"
    ADD CONSTRAINT "call_transcriptions_call_id_key" UNIQUE ("call_id");



ALTER TABLE ONLY "public"."call_transcriptions"
    ADD CONSTRAINT "call_transcriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_logs"
    ADD CONSTRAINT "chat_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_insights"
    ADD CONSTRAINT "client_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_client_code_key" UNIQUE ("client_code");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_partners"
    ADD CONSTRAINT "company_partners_pkey" PRIMARY KEY ("company_id", "partner_id");



ALTER TABLE ONLY "public"."deliverable_master"
    ADD CONSTRAINT "deliverable_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."department_instructions"
    ADD CONSTRAINT "department_instructions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_name_department_id_key" UNIQUE ("name", "department_id");



ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_notification_templates"
    ADD CONSTRAINT "email_notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_companies"
    ADD CONSTRAINT "employee_companies_employee_id_company_id_branch_id_key" UNIQUE ("employee_id", "company_id", "branch_id");



ALTER TABLE ONLY "public"."employee_companies"
    ADD CONSTRAINT "employee_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_event_id_key" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follow_up_auditions"
    ADD CONSTRAINT "follow_up_auditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instruction_approvals"
    ADD CONSTRAINT "instruction_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_drafts"
    ADD CONSTRAINT "lead_drafts_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."lead_drafts"
    ADD CONSTRAINT "lead_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_followups"
    ADD CONSTRAINT "lead_followups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_sources"
    ADD CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_task_performance"
    ADD CONSTRAINT "lead_task_performance_lead_id_task_id_key" UNIQUE ("lead_id", "task_id");



ALTER TABLE ONLY "public"."lead_task_performance"
    ADD CONSTRAINT "lead_task_performance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_lead_number_key" UNIQUE ("lead_number");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."management_insights"
    ADD CONSTRAINT "management_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_items_tracking"
    ADD CONSTRAINT "menu_items_tracking_menu_item_id_key" UNIQUE ("menu_item_id");



ALTER TABLE ONLY "public"."menu_items_tracking"
    ADD CONSTRAINT "menu_items_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ml_model_performance"
    ADD CONSTRAINT "ml_model_performance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_batches"
    ADD CONSTRAINT "notification_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_batches"
    ADD CONSTRAINT "notification_batches_user_id_notification_type_batch_key_key" UNIQUE ("user_id", "notification_type", "batch_key");



ALTER TABLE ONLY "public"."notification_engagement"
    ADD CONSTRAINT "notification_engagement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_patterns"
    ADD CONSTRAINT "notification_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_patterns"
    ADD CONSTRAINT "notification_patterns_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notification_recipients"
    ADD CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("notification_id", "user_id");



ALTER TABLE ONLY "public"."notification_rules"
    ADD CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_reference_key" UNIQUE ("payment_reference");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personalization_learning"
    ADD CONSTRAINT "personalization_learning_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_sale_confirmations"
    ADD CONSTRAINT "post_sale_confirmations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_sales_workflows"
    ADD CONSTRAINT "post_sales_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictive_insights"
    ADD CONSTRAINT "predictive_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."query_performance_logs"
    ADD CONSTRAINT "query_performance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_approvals"
    ADD CONSTRAINT "quotation_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_events"
    ADD CONSTRAINT "quotation_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_predictions"
    ADD CONSTRAINT "quotation_predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_revisions"
    ADD CONSTRAINT "quotation_revisions_original_quotation_id_revision_number_key" UNIQUE ("original_quotation_id", "revision_number");



ALTER TABLE ONLY "public"."quotation_revisions"
    ADD CONSTRAINT "quotation_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_workflow_history"
    ADD CONSTRAINT "quotation_workflow_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_quotation_number_key" UNIQUE ("quotation_number");



ALTER TABLE ONLY "public"."quote_components"
    ADD CONSTRAINT "quote_components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_deliverables_snapshot"
    ADD CONSTRAINT "quote_deliverables_snapshot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_services_snapshot"
    ADD CONSTRAINT "quote_services_snapshot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."revenue_forecasts"
    ADD CONSTRAINT "revenue_forecasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_menu_permissions"
    ADD CONSTRAINT "role_menu_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_menu_permissions"
    ADD CONSTRAINT "role_menu_permissions_role_id_menu_item_id_key" UNIQUE ("role_id", "menu_item_id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_activities"
    ADD CONSTRAINT "sales_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_performance_metrics"
    ADD CONSTRAINT "sales_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_team_members"
    ADD CONSTRAINT "sales_team_members_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."sales_team_members"
    ADD CONSTRAINT "sales_team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sequence_rules"
    ADD CONSTRAINT "sequence_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sequence_steps"
    ADD CONSTRAINT "sequence_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_packages"
    ADD CONSTRAINT "service_packages_package_name_key" UNIQUE ("package_name");



ALTER TABLE ONLY "public"."service_packages"
    ADD CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_supplier_code_key" UNIQUE ("supplier_code");



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_generation_log"
    ADD CONSTRAINT "task_generation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_performance_metrics"
    ADD CONSTRAINT "task_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_performance_metrics"
    ADD CONSTRAINT "task_performance_metrics_task_id_unique" UNIQUE ("task_id");



ALTER TABLE ONLY "public"."task_sequence_templates"
    ADD CONSTRAINT "task_sequence_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_status_history"
    ADD CONSTRAINT "task_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "employee_id");



ALTER TABLE ONLY "public"."team_performance_trends"
    ADD CONSTRAINT "team_performance_trends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "unique_role_name" UNIQUE ("name");



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "user_accounts_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "user_accounts_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."user_activity_history"
    ADD CONSTRAINT "user_activity_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ai_profiles"
    ADD CONSTRAINT "user_ai_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ai_profiles"
    ADD CONSTRAINT "user_ai_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_behavior_analytics"
    ADD CONSTRAINT "user_behavior_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_behavior_analytics"
    ADD CONSTRAINT "user_behavior_analytics_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_engagement_analytics"
    ADD CONSTRAINT "user_engagement_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_id_mapping"
    ADD CONSTRAINT "user_id_mapping_pkey" PRIMARY KEY ("numeric_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_vendor_code_key" UNIQUE ("vendor_code");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_config"
    ADD CONSTRAINT "whatsapp_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_templates"
    ADD CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_templates"
    ADD CONSTRAINT "whatsapp_templates_template_name_key" UNIQUE ("template_name");



CREATE UNIQUE INDEX "branches_branch_code_idx" ON "public"."branches" USING "btree" ("branch_code");



CREATE UNIQUE INDEX "companies_company_code_idx" ON "public"."companies" USING "btree" ("company_code");



CREATE INDEX "deliverable_master_category_idx" ON "public"."deliverable_master" USING "btree" ("category");



CREATE INDEX "deliverable_master_category_type_idx" ON "public"."deliverable_master" USING "btree" ("category", "type");



CREATE INDEX "deliverable_master_deliverable_name_idx" ON "public"."deliverable_master" USING "btree" ("deliverable_name");



CREATE INDEX "deliverable_master_type_idx" ON "public"."deliverable_master" USING "btree" ("type");



CREATE INDEX "follow_up_auditions_audition_id_idx" ON "public"."follow_up_auditions" USING "btree" ("audition_id");



CREATE INDEX "idx_accounting_workflows_quotation_id" ON "public"."accounting_workflows" USING "btree" ("quotation_id");



CREATE INDEX "idx_action_recommendations_completed" ON "public"."action_recommendations" USING "btree" ("is_completed");



CREATE INDEX "idx_action_recommendations_priority" ON "public"."action_recommendations" USING "btree" ("priority");



CREATE INDEX "idx_action_recommendations_quotation_id" ON "public"."action_recommendations" USING "btree" ("quotation_id");



CREATE INDEX "idx_activities_action_type" ON "public"."activities" USING "btree" ("action_type");



CREATE INDEX "idx_activities_action_type_entity_id" ON "public"."activities" USING "btree" ("action_type", "entity_id", "created_at" DESC) WHERE (("action_type")::"text" = 'reject'::"text");



CREATE INDEX "idx_activities_created_at" ON "public"."activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activities_entity_id" ON "public"."activities" USING "btree" ("entity_id");



CREATE INDEX "idx_activities_entity_id_action_type" ON "public"."activities" USING "btree" ("entity_id", "action_type");



CREATE INDEX "idx_activities_entity_type" ON "public"."activities" USING "btree" ("entity_type");



CREATE INDEX "idx_ai_behavior_settings_active" ON "public"."ai_behavior_settings" USING "btree" ("is_active");



CREATE INDEX "idx_ai_configurations_active" ON "public"."ai_configurations" USING "btree" ("is_active");



CREATE INDEX "idx_ai_configurations_type" ON "public"."ai_configurations" USING "btree" ("config_type");



CREATE INDEX "idx_ai_contacts_phone" ON "public"."ai_contacts" USING "btree" ("phone");



CREATE INDEX "idx_ai_decision_log_notification_id" ON "public"."ai_decision_log" USING "btree" ("notification_id");



CREATE INDEX "idx_ai_performance_model_type" ON "public"."ai_performance_tracking" USING "btree" ("model_type");



CREATE INDEX "idx_ai_prompt_templates_active" ON "public"."ai_prompt_templates" USING "btree" ("is_active");



CREATE INDEX "idx_ai_prompt_templates_default" ON "public"."ai_prompt_templates" USING "btree" ("is_default");



CREATE INDEX "idx_ai_recommendations_type" ON "public"."ai_recommendations" USING "btree" ("recommendation_type");



CREATE INDEX "idx_ai_recommendations_user_id" ON "public"."ai_recommendations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_tasks_assigned_to" ON "public"."ai_tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_ai_tasks_category" ON "public"."ai_tasks" USING "btree" ("category");



CREATE INDEX "idx_ai_tasks_client_name" ON "public"."ai_tasks" USING "btree" ("client_name");



CREATE INDEX "idx_ai_tasks_lead_id" ON "public"."ai_tasks" USING "btree" ("lead_id");



CREATE INDEX "idx_ai_tasks_priority" ON "public"."ai_tasks" USING "btree" ("priority");



CREATE INDEX "idx_ai_tasks_quotation_id" ON "public"."ai_tasks" USING "btree" ("quotation_id");



CREATE INDEX "idx_ai_tasks_status" ON "public"."ai_tasks" USING "btree" ("status");



CREATE INDEX "idx_analytics_cache_key" ON "public"."analytics_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_analytics_metrics_name_time" ON "public"."analytics_metrics" USING "btree" ("metric_name", "recorded_at" DESC);



CREATE INDEX "idx_branches_id_name" ON "public"."branches" USING "btree" ("id") INCLUDE ("name");



CREATE INDEX "idx_bug_attachments_bug_id" ON "public"."bug_attachments" USING "btree" ("bug_id");



CREATE INDEX "idx_bug_comments_bug_id" ON "public"."bug_comments" USING "btree" ("bug_id");



CREATE INDEX "idx_bugs_assignee" ON "public"."bugs" USING "btree" ("assignee_id");



CREATE INDEX "idx_bugs_severity" ON "public"."bugs" USING "btree" ("severity");



CREATE INDEX "idx_bugs_status" ON "public"."bugs" USING "btree" ("status");



CREATE INDEX "idx_business_trends_analyzed_at" ON "public"."business_trends" USING "btree" ("analyzed_at" DESC);



CREATE INDEX "idx_business_trends_type" ON "public"."business_trends" USING "btree" ("trend_type");



CREATE INDEX "idx_call_transcriptions_status" ON "public"."call_transcriptions" USING "btree" ("status");



CREATE INDEX "idx_call_transcriptions_task_id" ON "public"."call_transcriptions" USING "btree" ("task_id");



CREATE INDEX "idx_client_insights_client_name" ON "public"."client_insights" USING "btree" ("client_name");



CREATE INDEX "idx_client_insights_conversion_probability" ON "public"."client_insights" USING "btree" ("conversion_probability" DESC);



CREATE INDEX "idx_clients_client_code" ON "public"."clients" USING "btree" ("client_code");



CREATE INDEX "idx_clients_company_id" ON "public"."clients" USING "btree" ("company_id");



CREATE INDEX "idx_companies_id_name" ON "public"."companies" USING "btree" ("id") INCLUDE ("name");



CREATE INDEX "idx_deliverables_cat" ON "public"."deliverables" USING "btree" ("deliverable_cat");



CREATE INDEX "idx_deliverables_deliverable_id" ON "public"."deliverables" USING "btree" ("deliverable_id");



CREATE INDEX "idx_deliverables_sort_order" ON "public"."deliverables" USING "btree" ("sort_order");



CREATE INDEX "idx_deliverables_status" ON "public"."deliverables" USING "btree" ("status");



CREATE INDEX "idx_deliverables_type" ON "public"."deliverables" USING "btree" ("deliverable_type");



CREATE INDEX "idx_department_instructions_quotation_id" ON "public"."department_instructions" USING "btree" ("quotation_id");



CREATE INDEX "idx_employees_active" ON "public"."employees" USING "btree" ("status") WHERE (("status")::"text" = 'active'::"text");



CREATE INDEX "idx_employees_status" ON "public"."employees" USING "btree" ("status");



CREATE INDEX "idx_events_event_id" ON "public"."events" USING "btree" ("event_id");



CREATE INDEX "idx_events_is_active" ON "public"."events" USING "btree" ("is_active");



CREATE INDEX "idx_events_name" ON "public"."events" USING "btree" ("name");



CREATE INDEX "idx_instruction_approvals_instruction_id" ON "public"."instruction_approvals" USING "btree" ("instruction_id");



CREATE INDEX "idx_lead_followups_completed_at" ON "public"."lead_followups" USING "btree" ("completed_at");



CREATE INDEX "idx_lead_followups_created_by" ON "public"."lead_followups" USING "btree" ("created_by");



CREATE INDEX "idx_lead_followups_lead_id" ON "public"."lead_followups" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_followups_priority" ON "public"."lead_followups" USING "btree" ("priority");



CREATE INDEX "idx_lead_followups_quotation_id" ON "public"."lead_followups" USING "btree" ("quotation_id");



CREATE INDEX "idx_lead_followups_scheduled_at" ON "public"."lead_followups" USING "btree" ("scheduled_at");



CREATE INDEX "idx_lead_followups_status" ON "public"."lead_followups" USING "btree" ("status");



CREATE INDEX "idx_lead_task_performance_lead_id" ON "public"."lead_task_performance" USING "btree" ("lead_id");



CREATE INDEX "idx_leads_assigned_status" ON "public"."leads" USING "btree" ("assigned_to", "status");



CREATE INDEX "idx_leads_assigned_to" ON "public"."leads" USING "btree" ("assigned_to");



CREATE INDEX "idx_leads_assigned_to_uuid" ON "public"."leads" USING "btree" ("assigned_to_uuid");



CREATE INDEX "idx_leads_branch_id" ON "public"."leads" USING "btree" ("branch_id");



CREATE INDEX "idx_leads_company_branch" ON "public"."leads" USING "btree" ("company_id", "branch_id");



CREATE INDEX "idx_leads_company_branch_status" ON "public"."leads" USING "btree" ("company_id", "branch_id") WHERE (("status")::"text" = 'REJECTED'::"text");



CREATE INDEX "idx_leads_company_id" ON "public"."leads" USING "btree" ("company_id");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_lead_number" ON "public"."leads" USING "btree" ("lead_number");



CREATE INDEX "idx_leads_prev_assigned" ON "public"."leads" USING "btree" ("previous_assigned_to");



CREATE INDEX "idx_leads_reassigned_at" ON "public"."leads" USING "btree" ("reassigned_at");



CREATE INDEX "idx_leads_reassigned_by" ON "public"."leads" USING "btree" ("reassigned_by");



CREATE INDEX "idx_leads_reassigned_from_branch" ON "public"."leads" USING "btree" ("reassigned_from_branch_id");



CREATE INDEX "idx_leads_reassigned_from_company" ON "public"."leads" USING "btree" ("reassigned_from_company_id");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_leads_updated_at" ON "public"."leads" USING "btree" ("updated_at");



CREATE INDEX "idx_management_insights_addressed" ON "public"."management_insights" USING "btree" ("is_addressed");



CREATE INDEX "idx_management_insights_priority" ON "public"."management_insights" USING "btree" ("priority");



CREATE INDEX "idx_menu_items_tracking_menu_item_id" ON "public"."menu_items_tracking" USING "btree" ("menu_item_id");



CREATE UNIQUE INDEX "idx_mv_user_roles_fast_email" ON "public"."mv_user_roles_fast" USING "btree" ("lower"(("email")::"text"));



CREATE INDEX "idx_mv_user_roles_fast_user_id" ON "public"."mv_user_roles_fast" USING "btree" ("user_id");



CREATE INDEX "idx_notification_batches_last_sent" ON "public"."notification_batches" USING "btree" ("last_sent");



CREATE INDEX "idx_notification_batches_user_type" ON "public"."notification_batches" USING "btree" ("user_id", "notification_type");



CREATE INDEX "idx_notification_engagement_notification_id" ON "public"."notification_engagement" USING "btree" ("notification_id");



CREATE INDEX "idx_notification_engagement_user_event" ON "public"."notification_engagement" USING "btree" ("user_id", "event_type", "created_at" DESC);



CREATE INDEX "idx_notification_patterns_type" ON "public"."notification_patterns" USING "btree" ("type");



CREATE INDEX "idx_notifications_composite" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_created_at_desc" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_expires_at" ON "public"."notifications" USING "btree" ("expires_at");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_metadata_business" ON "public"."notifications" USING "gin" ("metadata") WHERE (("metadata" ->> 'business_event'::"text") = 'true'::"text");



CREATE INDEX "idx_notifications_priority" ON "public"."notifications" USING "btree" ("priority");



CREATE INDEX "idx_notifications_priority_created" ON "public"."notifications" USING "btree" ("priority", "created_at" DESC);



CREATE INDEX "idx_notifications_quotation_id" ON "public"."notifications" USING "btree" ("quotation_id");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_role", "recipient_id") WHERE ("recipient_role" IS NOT NULL);



CREATE INDEX "idx_notifications_scheduled_for" ON "public"."notifications" USING "btree" ("scheduled_for") WHERE ("scheduled_for" IS NOT NULL);



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_type_user" ON "public"."notifications" USING "btree" ("type", "user_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_type" ON "public"."notifications" USING "btree" ("user_id", "type");



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_payments_quotation_id" ON "public"."payments" USING "btree" ("quotation_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_personalization_learning_user_id" ON "public"."personalization_learning" USING "btree" ("user_id");



CREATE INDEX "idx_post_sale_confirmations_call_date" ON "public"."post_sale_confirmations" USING "btree" ("call_date");



CREATE INDEX "idx_post_sale_confirmations_confirmed_by" ON "public"."post_sale_confirmations" USING "btree" ("confirmed_by_user_id");



CREATE INDEX "idx_post_sale_confirmations_follow_up" ON "public"."post_sale_confirmations" USING "btree" ("follow_up_required", "follow_up_date");



CREATE INDEX "idx_post_sale_confirmations_quotation_id" ON "public"."post_sale_confirmations" USING "btree" ("quotation_id");



CREATE INDEX "idx_post_sales_workflows_quotation_id" ON "public"."post_sales_workflows" USING "btree" ("quotation_id");



CREATE INDEX "idx_predictive_insights_probability" ON "public"."predictive_insights" USING "btree" ("probability" DESC);



CREATE INDEX "idx_predictive_insights_user_status" ON "public"."predictive_insights" USING "btree" ("user_id", "status");



CREATE INDEX "idx_quotation_approvals_quotation_id" ON "public"."quotation_approvals" USING "btree" ("quotation_id");



CREATE INDEX "idx_quotation_approvals_status" ON "public"."quotation_approvals" USING "btree" ("approval_status");



CREATE INDEX "idx_quotation_events_date" ON "public"."quotation_events" USING "btree" ("event_date");



CREATE INDEX "idx_quotation_events_quotation_date" ON "public"."quotation_events" USING "btree" ("quotation_id", "event_date");



CREATE INDEX "idx_quotation_events_quotation_id" ON "public"."quotation_events" USING "btree" ("quotation_id");



CREATE INDEX "idx_quotation_predictions_predicted_at" ON "public"."quotation_predictions" USING "btree" ("predicted_at" DESC);



CREATE INDEX "idx_quotation_predictions_quotation_id" ON "public"."quotation_predictions" USING "btree" ("quotation_id");



CREATE INDEX "idx_quotation_revisions_original_id" ON "public"."quotation_revisions" USING "btree" ("original_quotation_id");



CREATE INDEX "idx_quotations_created_at" ON "public"."quotations" USING "btree" ("created_at");



CREATE INDEX "idx_quotations_created_by" ON "public"."quotations" USING "btree" ("created_by");



CREATE INDEX "idx_quotations_created_by_status" ON "public"."quotations" USING "btree" ("created_by", "status");



CREATE INDEX "idx_quotations_lead_id" ON "public"."quotations" USING "btree" ("lead_id");



CREATE INDEX "idx_quotations_quotation_number" ON "public"."quotations" USING "btree" ("quotation_number");



CREATE INDEX "idx_quotations_status" ON "public"."quotations" USING "btree" ("status");



CREATE INDEX "idx_quotations_status_created_at" ON "public"."quotations" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_quotations_total_amount" ON "public"."quotations" USING "btree" ("total_amount") WHERE ("total_amount" > (0)::numeric);



CREATE INDEX "idx_quotations_workflow_status" ON "public"."quotations" USING "btree" ("workflow_status");



CREATE INDEX "idx_revenue_forecasts_period" ON "public"."revenue_forecasts" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_roles_id_minimal" ON "public"."roles" USING "btree" ("id");



CREATE INDEX "idx_roles_title_minimal" ON "public"."roles" USING "btree" ("title");



CREATE INDEX "idx_roles_title_permissions" ON "public"."roles" USING "btree" ("title", "permissions") WHERE ("title" IS NOT NULL);



CREATE INDEX "idx_sales_activities_date" ON "public"."sales_activities" USING "btree" ("activity_date" DESC);



CREATE INDEX "idx_sales_activities_employee_id" ON "public"."sales_activities" USING "btree" ("employee_id");



CREATE INDEX "idx_sales_activities_quotation_id" ON "public"."sales_activities" USING "btree" ("quotation_id");



CREATE INDEX "idx_sales_performance_metrics_employee_id" ON "public"."sales_performance_metrics" USING "btree" ("employee_id");



CREATE INDEX "idx_sales_performance_metrics_period" ON "public"."sales_performance_metrics" USING "btree" ("metric_period" DESC);



CREATE UNIQUE INDEX "idx_sales_performance_metrics_unique" ON "public"."sales_performance_metrics" USING "btree" ("employee_id", "metric_period");



CREATE INDEX "idx_sales_performance_period_employee" ON "public"."sales_performance_metrics" USING "btree" ("metric_period" DESC, "employee_id");



CREATE INDEX "idx_sales_performance_score" ON "public"."sales_performance_metrics" USING "btree" ("performance_score" DESC) WHERE ("performance_score" IS NOT NULL);



CREATE INDEX "idx_sales_team_members_employee_id" ON "public"."sales_team_members" USING "btree" ("employee_id");



CREATE INDEX "idx_sales_team_members_role" ON "public"."sales_team_members" USING "btree" ("role");



CREATE INDEX "idx_sequence_rules_active" ON "public"."sequence_rules" USING "btree" ("is_active");



CREATE INDEX "idx_sequence_rules_template" ON "public"."sequence_rules" USING "btree" ("sequence_template_id");



CREATE INDEX "idx_sequence_steps_number" ON "public"."sequence_steps" USING "btree" ("step_number");



CREATE INDEX "idx_sequence_steps_template" ON "public"."sequence_steps" USING "btree" ("sequence_template_id");



CREATE INDEX "idx_sequence_templates_active" ON "public"."task_sequence_templates" USING "btree" ("is_active");



CREATE INDEX "idx_sequence_templates_category" ON "public"."task_sequence_templates" USING "btree" ("category");



CREATE INDEX "idx_system_logs_action_time" ON "public"."system_logs" USING "btree" ("action", "created_at" DESC);



CREATE INDEX "idx_task_generation_log_lead_id" ON "public"."task_generation_log" USING "btree" ("lead_id");



CREATE INDEX "idx_task_performance_metrics_assigned_to" ON "public"."task_performance_metrics" USING "btree" ("assigned_to");



CREATE INDEX "idx_task_performance_metrics_created_date" ON "public"."task_performance_metrics" USING "btree" ("created_date");



CREATE INDEX "idx_task_status_history_changed_at" ON "public"."task_status_history" USING "btree" ("changed_at");



CREATE INDEX "idx_task_status_history_task_id" ON "public"."task_status_history" USING "btree" ("task_id");



CREATE INDEX "idx_team_performance_trends_period" ON "public"."team_performance_trends" USING "btree" ("period_start" DESC);



CREATE INDEX "idx_user_accounts_email_fast" ON "public"."user_accounts" USING "btree" ("lower"(("email")::"text")) WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_user_accounts_email_minimal" ON "public"."user_accounts" USING "btree" ("email");



CREATE INDEX "idx_user_accounts_employee_id" ON "public"."user_accounts" USING "btree" ("employee_id");



CREATE INDEX "idx_user_accounts_id_role" ON "public"."user_accounts" USING "btree" ("id", "role_id") WHERE ("id" IS NOT NULL);



CREATE INDEX "idx_user_accounts_login_composite" ON "public"."user_accounts" USING "btree" ("lower"(("email")::"text"), "password_hash", "role_id") WHERE (("email" IS NOT NULL) AND ("password_hash" IS NOT NULL));



CREATE INDEX "idx_user_accounts_role_id" ON "public"."user_accounts" USING "btree" ("role_id");



CREATE INDEX "idx_user_activity_history_user_id_created" ON "public"."user_activity_history" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_user_ai_profiles_user_id" ON "public"."user_ai_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_behavior_analytics_engagement" ON "public"."user_behavior_analytics" USING "btree" ("engagement_score" DESC);



CREATE INDEX "idx_user_behavior_analytics_user_id" ON "public"."user_behavior_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_user_engagement_created_at" ON "public"."user_engagement_analytics" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_engagement_user_id" ON "public"."user_engagement_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_user_preferences_user_id" ON "public"."user_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE INDEX "idx_whatsapp_messages_created_at" ON "public"."whatsapp_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_whatsapp_messages_status" ON "public"."whatsapp_messages" USING "btree" ("status");



CREATE INDEX "idx_whatsapp_messages_user_id" ON "public"."whatsapp_messages" USING "btree" ("user_id");



CREATE INDEX "idx_workflow_history_quotation_id" ON "public"."quotation_workflow_history" USING "btree" ("quotation_id");



CREATE OR REPLACE TRIGGER "employee_status_change_trigger" AFTER UPDATE OF "status" ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."handle_lead_reallocation"();



CREATE OR REPLACE TRIGGER "ensure_lead_source_id" BEFORE INSERT OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_lead_source_id"();



CREATE OR REPLACE TRIGGER "ensure_rejection_fields_trigger" BEFORE INSERT OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_rejection_fields"();



CREATE OR REPLACE TRIGGER "normalize_branch_location" BEFORE INSERT OR UPDATE ON "public"."branches" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_location_trigger"();



CREATE OR REPLACE TRIGGER "normalize_lead_location" BEFORE INSERT OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_location_trigger"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_bug_comments_updated_at" BEFORE UPDATE ON "public"."bug_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_bugs_updated_at" BEFORE UPDATE ON "public"."bugs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_track_user_activity" AFTER INSERT ON "public"."user_activity_history" FOR EACH ROW EXECUTE FUNCTION "public"."track_user_activity"();



CREATE OR REPLACE TRIGGER "trigger_update_engagement_score" AFTER INSERT ON "public"."notification_engagement" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_engagement_score"();



CREATE OR REPLACE TRIGGER "trigger_update_quotation_approval_timestamp" BEFORE UPDATE ON "public"."quotation_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."update_quotation_approval_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_quotation_workflow_status" AFTER UPDATE ON "public"."quotation_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."update_quotation_workflow_status"();



CREATE OR REPLACE TRIGGER "update_ai_tasks_updated_at" BEFORE UPDATE ON "public"."ai_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clients_updated_at_trigger" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_clients_updated_at"();



CREATE OR REPLACE TRIGGER "update_departments_modtime" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_designations_modtime" BEFORE UPDATE ON "public"."designations" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_employee_companies_timestamp" BEFORE UPDATE ON "public"."employee_companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_employees_timestamp" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_menu_items_timestamp" BEFORE UPDATE ON "public"."menu_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_role_menu_permissions_timestamp" BEFORE UPDATE ON "public"."role_menu_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_roles_timestamp" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_supplier_timestamp" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_supplier_timestamp"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vendor_timestamp" BEFORE UPDATE ON "public"."vendors" FOR EACH ROW EXECUTE FUNCTION "public"."update_vendor_timestamp"();



CREATE OR REPLACE TRIGGER "validate_department_designation_trigger" BEFORE INSERT OR UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."validate_department_designation"();



CREATE OR REPLACE TRIGGER "validate_employee_allocation_trigger" BEFORE INSERT OR UPDATE ON "public"."employee_companies" FOR EACH ROW EXECUTE FUNCTION "public"."validate_employee_allocation"();



ALTER TABLE ONLY "audit_security"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "audit_security"."permissions"("id");



ALTER TABLE ONLY "audit_security"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "audit_security"."roles"("id");



ALTER TABLE ONLY "audit_security"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "audit_security"."roles"("id");



ALTER TABLE ONLY "public"."accounting_workflows"
    ADD CONSTRAINT "accounting_workflows_instruction_id_fkey" FOREIGN KEY ("instruction_id") REFERENCES "public"."department_instructions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounting_workflows"
    ADD CONSTRAINT "accounting_workflows_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounting_workflows"
    ADD CONSTRAINT "accounting_workflows_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_decision_log"
    ADD CONSTRAINT "ai_decision_log_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bug_attachments"
    ADD CONSTRAINT "bug_attachments_bug_id_fkey" FOREIGN KEY ("bug_id") REFERENCES "public"."bugs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bug_attachments"
    ADD CONSTRAINT "bug_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bug_comments"
    ADD CONSTRAINT "bug_comments_bug_id_fkey" FOREIGN KEY ("bug_id") REFERENCES "public"."bugs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bug_comments"
    ADD CONSTRAINT "bug_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bugs"
    ADD CONSTRAINT "bugs_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bugs"
    ADD CONSTRAINT "bugs_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_partners"
    ADD CONSTRAINT "company_partners_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_partners"
    ADD CONSTRAINT "company_partners_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."department_instructions"
    ADD CONSTRAINT "department_instructions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."department_instructions"
    ADD CONSTRAINT "department_instructions_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_parent_department_id_fkey" FOREIGN KEY ("parent_department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."designations"
    ADD CONSTRAINT "designations_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_companies"
    ADD CONSTRAINT "employee_companies_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."employee_companies"
    ADD CONSTRAINT "employee_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."employee_companies"
    ADD CONSTRAINT "employee_companies_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_home_branch_id_fkey" FOREIGN KEY ("home_branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_primary_company_id_fkey" FOREIGN KEY ("primary_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."lead_followups"
    ADD CONSTRAINT "fk_lead_followups_lead_id" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "fk_lead_source" FOREIGN KEY ("lead_source_id") REFERENCES "public"."lead_sources"("id");



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "fk_user_accounts_employee_id" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "fk_user_accounts_role_id" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."follow_up_auditions"
    ADD CONSTRAINT "follow_up_auditions_audition_id_fkey" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instruction_approvals"
    ADD CONSTRAINT "instruction_approvals_instruction_id_fkey" FOREIGN KEY ("instruction_id") REFERENCES "public"."department_instructions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_followups"
    ADD CONSTRAINT "lead_followups_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_reassigned_by_fkey" FOREIGN KEY ("reassigned_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_reassigned_from_branch_id_fkey" FOREIGN KEY ("reassigned_from_branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_reassigned_from_company_id_fkey" FOREIGN KEY ("reassigned_from_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."management_insights"
    ADD CONSTRAINT "management_insights_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."sales_team_members"("employee_id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id");



ALTER TABLE ONLY "public"."notification_engagement"
    ADD CONSTRAINT "notification_engagement_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_engagement"
    ADD CONSTRAINT "notification_engagement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notification_recipients"
    ADD CONSTRAINT "notification_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personalization_learning"
    ADD CONSTRAINT "personalization_learning_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_sale_confirmations"
    ADD CONSTRAINT "post_sale_confirmations_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_sales_workflows"
    ADD CONSTRAINT "post_sales_workflows_instruction_id_fkey" FOREIGN KEY ("instruction_id") REFERENCES "public"."department_instructions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_sales_workflows"
    ADD CONSTRAINT "post_sales_workflows_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_sales_workflows"
    ADD CONSTRAINT "post_sales_workflows_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictive_insights"
    ADD CONSTRAINT "predictive_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."quotation_approvals"
    ADD CONSTRAINT "quotation_approvals_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."quotation_approvals"
    ADD CONSTRAINT "quotation_approvals_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_events"
    ADD CONSTRAINT "quotation_events_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_revisions"
    ADD CONSTRAINT "quotation_revisions_original_quotation_id_fkey" FOREIGN KEY ("original_quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_workflow_history"
    ADD CONSTRAINT "quotation_workflow_history_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "public"."lead_followups"("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."role_menu_permissions"
    ADD CONSTRAINT "role_menu_permissions_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_menu_permissions"
    ADD CONSTRAINT "role_menu_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."sales_activities"
    ADD CONSTRAINT "sales_activities_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."sales_team_members"("employee_id");



ALTER TABLE ONLY "public"."sales_performance_metrics"
    ADD CONSTRAINT "sales_performance_metrics_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."sales_team_members"("employee_id");



ALTER TABLE ONLY "public"."sequence_rules"
    ADD CONSTRAINT "sequence_rules_sequence_template_id_fkey" FOREIGN KEY ("sequence_template_id") REFERENCES "public"."task_sequence_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sequence_steps"
    ADD CONSTRAINT "sequence_steps_sequence_template_id_fkey" FOREIGN KEY ("sequence_template_id") REFERENCES "public"."task_sequence_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."team_performance_trends"
    ADD CONSTRAINT "team_performance_trends_top_performer_id_fkey" FOREIGN KEY ("top_performer_id") REFERENCES "public"."sales_team_members"("employee_id");



ALTER TABLE ONLY "public"."team_performance_trends"
    ADD CONSTRAINT "team_performance_trends_underperformer_id_fkey" FOREIGN KEY ("underperformer_id") REFERENCES "public"."sales_team_members"("employee_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."user_activity_history"
    ADD CONSTRAINT "user_activity_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_ai_profiles"
    ADD CONSTRAINT "user_ai_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_behavior_analytics"
    ADD CONSTRAINT "user_behavior_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_engagement_analytics"
    ADD CONSTRAINT "user_engagement_analytics_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id");



ALTER TABLE ONLY "public"."user_engagement_analytics"
    ADD CONSTRAINT "user_engagement_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_id_mapping"
    ADD CONSTRAINT "user_id_mapping_uuid_fkey" FOREIGN KEY ("uuid") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id");



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."whatsapp_templates"("id");



CREATE POLICY "Admins can access all AI data" ON "public"."user_behavior_analytics" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Admins can manage email templates" ON "public"."email_notification_templates" USING (true);



CREATE POLICY "Admins can manage notification rules" ON "public"."notification_rules" USING (true);



CREATE POLICY "Allow all access to ai_tasks" ON "public"."ai_tasks" USING (true);



CREATE POLICY "Allow all access to lead_task_performance" ON "public"."lead_task_performance" USING (true);



CREATE POLICY "Allow all access to task_generation_log" ON "public"."task_generation_log" USING (true);



CREATE POLICY "Allow all access to task_performance_metrics" ON "public"."task_performance_metrics" USING (true);



CREATE POLICY "Allow all access to task_status_history" ON "public"."task_status_history" USING (true);



CREATE POLICY "Allow all operations for authenticated users" ON "public"."accounting_workflows" TO "authenticated" USING (true);



CREATE POLICY "Allow all operations for authenticated users" ON "public"."department_instructions" TO "authenticated" USING (true);



CREATE POLICY "Allow all operations for authenticated users" ON "public"."instruction_approvals" TO "authenticated" USING (true);



CREATE POLICY "Allow all operations for authenticated users" ON "public"."payments" TO "authenticated" USING (true);



CREATE POLICY "Allow all operations for authenticated users" ON "public"."post_sales_workflows" TO "authenticated" USING (true);



CREATE POLICY "Allow all operations for authenticated users" ON "public"."quotation_revisions" TO "authenticated" USING (true);



CREATE POLICY "Allow all operations on AI/ML tables" ON "public"."quotation_predictions" USING (true);



CREATE POLICY "Allow all operations on ML performance" ON "public"."ml_model_performance" USING (true);



CREATE POLICY "Allow all operations on action recommendations" ON "public"."action_recommendations" USING (true);



CREATE POLICY "Allow all operations on business trends" ON "public"."business_trends" USING (true);



CREATE POLICY "Allow all operations on client insights" ON "public"."client_insights" USING (true);



CREATE POLICY "Allow all operations on management insights" ON "public"."management_insights" USING (true);



CREATE POLICY "Allow all operations on revenue forecasts" ON "public"."revenue_forecasts" USING (true);



CREATE POLICY "Allow all operations on sales activities" ON "public"."sales_activities" USING (true);



CREATE POLICY "Allow all operations on sales performance metrics" ON "public"."sales_performance_metrics" USING (true);



CREATE POLICY "Allow all operations on sales team members" ON "public"."sales_team_members" USING (true);



CREATE POLICY "Allow all operations on team performance trends" ON "public"."team_performance_trends" USING (true);



CREATE POLICY "Authenticated users can manage deliverable master" ON "public"."deliverable_master" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can view deliverable master" ON "public"."deliverable_master" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can delete events for their quotations" ON "public"."quotation_events" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."quotations"
  WHERE (("quotations"."id" = "quotation_events"."quotation_id") AND (("quotations"."created_by")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can delete own notifications" ON "public"."notifications" FOR DELETE USING ((("user_id")::"text" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can delete their own quotations" ON "public"."quotations" FOR DELETE USING ((("auth"."uid"())::"text" = ("created_by")::"text"));



CREATE POLICY "Users can insert events for their quotations" ON "public"."quotation_events" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."quotations"
  WHERE (("quotations"."id" = "quotation_events"."quotation_id") AND (("quotations"."created_by")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can insert their own quotations" ON "public"."quotations" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("created_by")::"text"));



CREATE POLICY "Users can manage own notification settings" ON "public"."notification_settings" USING ((("user_id")::"text" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update events for their quotations" ON "public"."quotation_events" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."quotations"
  WHERE (("quotations"."id" = "quotation_events"."quotation_id") AND (("quotations"."created_by")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING ((("user_id")::"text" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update their own behavior analytics" ON "public"."user_behavior_analytics" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own quotations" ON "public"."quotations" FOR UPDATE USING ((("auth"."uid"())::"text" = ("created_by")::"text"));



CREATE POLICY "Users can view events for their quotations" ON "public"."quotation_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."quotations"
  WHERE (("quotations"."id" = "quotation_events"."quotation_id") AND (("quotations"."created_by")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING ((("user_id")::"text" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view their own activity history" ON "public"."user_activity_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own behavior analytics" ON "public"."user_behavior_analytics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own engagement data" ON "public"."notification_engagement" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own predictive insights" ON "public"."predictive_insights" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own preferences" ON "public"."user_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own quotations" ON "public"."quotations" FOR SELECT USING ((("auth"."uid"())::"text" = ("created_by")::"text"));



CREATE POLICY "Users delete own notifications" ON "public"."notifications" FOR DELETE USING (("user_id" = COALESCE((NULLIF((("current_setting"('request.jwt.claims'::"text", true))::"json" ->> 'sub'::"text"), ''::"text"))::integer, 0)));



CREATE POLICY "Users update own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = COALESCE((NULLIF((("current_setting"('request.jwt.claims'::"text", true))::"json" ->> 'sub'::"text"), ''::"text"))::integer, 0)));



CREATE POLICY "Users view own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = COALESCE((NULLIF((("current_setting"('request.jwt.claims'::"text", true))::"json" ->> 'sub'::"text"), ''::"text"))::integer, 0)));



ALTER TABLE "public"."accounting_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."action_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_trends" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."department_instructions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instruction_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_task_performance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."management_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ml_model_performance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_engagement" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_admin_access" ON "public"."notifications" USING (("public"."current_user_role"() = ANY (ARRAY['Administrator'::"text", 'Sales Head'::"text"])));



CREATE POLICY "notifications_user_access" ON "public"."notifications" USING (("user_id" = "public"."current_user_id"()));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_sales_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predictive_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_predictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_revisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revenue_forecasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_generation_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_performance_trends" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_behavior_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."add_employee"("p_first_name" character varying, "p_last_name" character varying, "p_email" character varying, "p_phone" character varying, "p_job_title" character varying, "p_department_id" integer, "p_designation_id" integer, "p_branch_id" integer, "p_hire_date" "date", "p_status" character varying, "p_notes" "text", "p_employee_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."add_employee"("p_first_name" character varying, "p_last_name" character varying, "p_email" character varying, "p_phone" character varying, "p_job_title" character varying, "p_department_id" integer, "p_designation_id" integer, "p_branch_id" integer, "p_hire_date" "date", "p_status" character varying, "p_notes" "text", "p_employee_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_employee"("p_first_name" character varying, "p_last_name" character varying, "p_email" character varying, "p_phone" character varying, "p_job_title" character varying, "p_department_id" integer, "p_designation_id" integer, "p_branch_id" integer, "p_hire_date" "date", "p_status" character varying, "p_notes" "text", "p_employee_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."analyze_view_performance"("p_view_name" "text", "p_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."analyze_view_performance"("p_view_name" "text", "p_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."analyze_view_performance"("p_view_name" "text", "p_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."api_get_users_by_role"("p_role_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."api_get_users_by_role"("p_role_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_get_users_by_role"("p_role_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."archive_completed_tasks"("days_old" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."archive_completed_tasks"("days_old" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_completed_tasks"("days_old" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."archive_old_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."archive_old_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_old_notifications"() TO "service_role";



GRANT ALL ON PROCEDURE "public"."assign_all_unassigned_leads"(IN "p_assigned_by" "uuid") TO "anon";
GRANT ALL ON PROCEDURE "public"."assign_all_unassigned_leads"(IN "p_assigned_by" "uuid") TO "authenticated";
GRANT ALL ON PROCEDURE "public"."assign_all_unassigned_leads"(IN "p_assigned_by" "uuid") TO "service_role";



GRANT ALL ON PROCEDURE "public"."assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_to" "uuid", IN "p_assigned_by" "uuid", IN "p_notes" "text") TO "anon";
GRANT ALL ON PROCEDURE "public"."assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_to" "uuid", IN "p_assigned_by" "uuid", IN "p_notes" "text") TO "authenticated";
GRANT ALL ON PROCEDURE "public"."assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_to" "uuid", IN "p_assigned_by" "uuid", IN "p_notes" "text") TO "service_role";



GRANT ALL ON PROCEDURE "public"."auto_assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_by" "uuid", IN "p_notes" "text") TO "anon";
GRANT ALL ON PROCEDURE "public"."auto_assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_by" "uuid", IN "p_notes" "text") TO "authenticated";
GRANT ALL ON PROCEDURE "public"."auto_assign_lead"(IN "p_lead_id" "uuid", IN "p_assigned_by" "uuid", IN "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_reassign_leads_on_employee_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_reassign_leads_on_employee_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_reassign_leads_on_employee_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_remove_employees"("emp_ids" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."batch_remove_employees"("emp_ids" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_remove_employees"("emp_ids" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_admin_menu_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_admin_menu_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_admin_menu_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_completion_consistency"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_completion_consistency"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_completion_consistency"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_employee_primary_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_employee_primary_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_employee_primary_company"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_primary_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_primary_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_primary_company"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_menu_permission"("p_user_id" "uuid", "p_menu_path" character varying, "p_permission" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_menu_permission"("p_user_id" "uuid", "p_menu_path" character varying, "p_permission" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_menu_permission"("p_user_id" "uuid", "p_menu_path" character varying, "p_permission" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_bugs_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_bugs_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_bugs_tables"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_clients_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_clients_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_clients_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event"("p_name" character varying, "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_event"("p_name" character varying, "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event"("p_name" character varying, "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_hr_activities_table_if_not_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_hr_activities_table_if_not_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_hr_activities_table_if_not_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_menu_tracking_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_menu_tracking_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_menu_tracking_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_system_logs_if_not_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_system_logs_if_not_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_system_logs_if_not_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_employee"("emp_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_employee"("emp_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_employee"("emp_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_employee"("employee_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_employee"("employee_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_employee"("employee_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_event"("p_event_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_event"("p_event_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_event"("p_event_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_vendor_safely"("vendor_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_vendor_safely"("vendor_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_vendor_safely"("vendor_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."disable_audit_triggers"() TO "anon";
GRANT ALL ON FUNCTION "public"."disable_audit_triggers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disable_audit_triggers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."disable_employee_triggers"() TO "anon";
GRANT ALL ON FUNCTION "public"."disable_employee_triggers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disable_employee_triggers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_audit_triggers"() TO "anon";
GRANT ALL ON FUNCTION "public"."enable_audit_triggers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_audit_triggers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_employee_triggers"() TO "anon";
GRANT ALL ON FUNCTION "public"."enable_employee_triggers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_employee_triggers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_admin_menu_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_admin_menu_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_admin_menu_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_menu_tracking_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_menu_tracking_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_menu_tracking_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_rejection_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_rejection_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_rejection_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_sql"("sql_statement" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql_statement" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql_statement" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_insights"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_insights"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_insights"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_event_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_event_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_event_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_system_configuration"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_system_configuration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_system_configuration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_best_sales_user_for_lead"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_best_sales_user_for_lead"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_best_sales_user_for_lead"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_complete_menu_hierarchy"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_complete_menu_hierarchy"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_complete_menu_hierarchy"("p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_comprehensive_employee_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_comprehensive_employee_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_comprehensive_employee_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversion_rates_by_source"("start_date" "date", "end_date" "date", "source_ids" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversion_rates_by_source"("start_date" "date", "end_date" "date", "source_ids" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversion_rates_by_source"("start_date" "date", "end_date" "date", "source_ids" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_employee_by_id"("employee_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_employee_by_id"("employee_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_employee_by_id"("employee_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_employee_department_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_employee_department_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_employee_department_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_by_id"("p_event_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_by_id"("p_event_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_by_id"("p_event_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_events"("p_is_active" boolean, "p_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_events"("p_is_active" boolean, "p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_events"("p_is_active" boolean, "p_search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lead_trends_by_date"("start_date" "date", "end_date" "date", "source_ids" integer[], "employee_ids" integer[], "status_list" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lead_trends_by_date"("start_date" "date", "end_date" "date", "source_ids" integer[], "employee_ids" integer[], "status_list" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lead_trends_by_date"("start_date" "date", "end_date" "date", "source_ids" integer[], "employee_ids" integer[], "status_list" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lowercase_anomalies"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_lowercase_anomalies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lowercase_anomalies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_rejected_leads_with_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_rejected_leads_with_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_rejected_leads_with_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sales_employees_for_lead"("lead_company_id" integer, "lead_location" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_sales_employees_for_lead"("lead_company_id" integer, "lead_location" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sales_employees_for_lead"("lead_company_id" integer, "lead_location" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_performance_metrics"("start_date" "date", "end_date" "date", "employee_ids" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_performance_metrics"("start_date" "date", "end_date" "date", "employee_ids" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_performance_metrics"("start_date" "date", "end_date" "date", "employee_ids" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_menu_permissions"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_menu_permissions"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_menu_permissions"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_by_role"("p_role_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_by_role"("p_role_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_by_role"("p_role_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_lead_reallocation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_lead_reallocation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_lead_reallocation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_employee_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_employee_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_employee_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_performance_metric"("metric_name" "text", "metric_value" numeric, "metric_unit" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_performance_metric"("metric_name" "text", "metric_value" numeric, "metric_unit" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_performance_metric"("metric_name" "text", "metric_value" numeric, "metric_unit" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_slow_queries"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_slow_queries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_slow_queries"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_task_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_task_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_task_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_view_performance"("p_view_name" "text", "p_rows_returned" integer, "p_execution_time_ms" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."log_view_performance"("p_view_name" "text", "p_rows_returned" integer, "p_execution_time_ms" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_view_performance"("p_view_name" "text", "p_rows_returned" integer, "p_execution_time_ms" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_location"("loc" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_location"("loc" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_location"("loc" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_location_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_location_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_location_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admins_of_lead_reassignment"("employee_id" integer, "employee_name" "text", "new_status" "text", "affected_leads_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admins_of_lead_reassignment"("employee_id" integer, "employee_name" "text", "new_status" "text", "affected_leads_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admins_of_lead_reassignment"("employee_id" integer, "employee_name" "text", "new_status" "text", "affected_leads_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_user_roles_fast"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_user_roles_fast"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_user_roles_fast"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_employee"("emp_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_employee"("emp_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_employee"("emp_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_employee_v2"("emp_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_employee_v2"("emp_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_employee_v2"("emp_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_employee_v3"("emp_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_employee_v3"("emp_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_employee_v3"("emp_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_employee_v4"("emp_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_employee_v4"("emp_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_employee_v4"("emp_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_employee_v5"("emp_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_employee_v5"("emp_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_employee_v5"("emp_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."run_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_lead_source_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_lead_source_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_lead_source_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_session_variable"("var_name" "text", "var_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_session_variable"("var_name" "text", "var_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_session_variable"("var_name" "text", "var_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_hr_activities_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."setup_hr_activities_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_hr_activities_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."should_batch_notification"("p_user_id" integer, "p_type" character varying, "p_batch_key" character varying, "p_batch_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."should_batch_notification"("p_user_id" integer, "p_type" character varying, "p_batch_key" character varying, "p_batch_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_batch_notification"("p_user_id" integer, "p_type" character varying, "p_batch_key" character varying, "p_batch_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."should_skip_audit_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."should_skip_audit_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_skip_audit_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_employee_location"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_employee_location"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_employee_location"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_employee_primary_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_employee_primary_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_employee_primary_company"() TO "service_role";



GRANT ALL ON FUNCTION "public"."table_exists"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."table_exists"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."table_exists"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_lead_reallocation"("p_employee_id" integer, "p_new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."test_lead_reallocation"("p_employee_id" integer, "p_new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_lead_reallocation"("p_employee_id" integer, "p_new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_user_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_user_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_user_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_clients_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_clients_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_clients_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_name"("p_event_id" "text", "p_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_name"("p_event_id" "text", "p_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_name"("p_event_id" "text", "p_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_status"("p_event_id" "text", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_status"("p_event_id" "text", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_status"("p_event_id" "text", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_menu_item_permissions"("p_role_id" integer, "p_menu_item_id" integer, "p_can_view" boolean, "p_can_add" boolean, "p_can_edit" boolean, "p_can_delete" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_menu_item_permissions"("p_role_id" integer, "p_menu_item_id" integer, "p_can_view" boolean, "p_can_add" boolean, "p_can_edit" boolean, "p_can_delete" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_menu_item_permissions"("p_role_id" integer, "p_menu_item_id" integer, "p_can_view" boolean, "p_can_add" boolean, "p_can_edit" boolean, "p_can_delete" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quotation_approval_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_quotation_approval_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quotation_approval_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quotation_workflow_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_quotation_workflow_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quotation_workflow_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quotations_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_quotations_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quotations_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_supplier_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_supplier_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_supplier_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_task_performance_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_task_performance_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_task_performance_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_engagement_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_engagement_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_engagement_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vendor_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vendor_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vendor_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_ai_response"("response_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_ai_response"("response_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_ai_response"("response_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_department_designation"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_department_designation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_department_designation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_employee_allocation"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_employee_allocation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_employee_allocation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_employee_company_percentage"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_employee_company_percentage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_employee_company_percentage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_phone_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_phone_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_phone_number"() TO "service_role";


















GRANT ALL ON TABLE "public"."accounting_workflows" TO "anon";
GRANT ALL ON TABLE "public"."accounting_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."accounting_workflows" TO "service_role";



GRANT ALL ON SEQUENCE "public"."accounting_workflows_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."accounting_workflows_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."accounting_workflows_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."action_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."action_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."action_recommendations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."action_recommendations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."action_recommendations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."action_recommendations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."ai_behavior_settings" TO "anon";
GRANT ALL ON TABLE "public"."ai_behavior_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_behavior_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_behavior_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_behavior_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_behavior_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_configurations" TO "anon";
GRANT ALL ON TABLE "public"."ai_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_configurations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_configurations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_configurations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_configurations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_contacts" TO "anon";
GRANT ALL ON TABLE "public"."ai_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."ai_decision_log" TO "anon";
GRANT ALL ON TABLE "public"."ai_decision_log" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_decision_log" TO "service_role";



GRANT ALL ON TABLE "public"."predictive_insights" TO "anon";
GRANT ALL ON TABLE "public"."predictive_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."predictive_insights" TO "service_role";



GRANT ALL ON TABLE "public"."ai_insights_summary" TO "anon";
GRANT ALL ON TABLE "public"."ai_insights_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_insights_summary" TO "service_role";



GRANT ALL ON TABLE "public"."ai_performance_tracking" TO "anon";
GRANT ALL ON TABLE "public"."ai_performance_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_performance_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."ai_prompt_templates" TO "anon";
GRANT ALL ON TABLE "public"."ai_prompt_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_prompt_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_prompt_templates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_prompt_templates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_prompt_templates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_tasks" TO "anon";
GRANT ALL ON TABLE "public"."ai_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_tasks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_tasks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_tasks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_cache" TO "anon";
GRANT ALL ON TABLE "public"."analytics_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_cache" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_metrics" TO "anon";
GRANT ALL ON TABLE "public"."analytics_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."auditions" TO "anon";
GRANT ALL ON TABLE "public"."auditions" TO "authenticated";
GRANT ALL ON TABLE "public"."auditions" TO "service_role";



GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."branches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."branches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."branches_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bug_attachments" TO "anon";
GRANT ALL ON TABLE "public"."bug_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."bug_attachments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bug_attachments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bug_attachments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bug_attachments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bug_comments" TO "anon";
GRANT ALL ON TABLE "public"."bug_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."bug_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bug_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bug_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bug_comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bugs" TO "anon";
GRANT ALL ON TABLE "public"."bugs" TO "authenticated";
GRANT ALL ON TABLE "public"."bugs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bugs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bugs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bugs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."business_trends" TO "anon";
GRANT ALL ON TABLE "public"."business_trends" TO "authenticated";
GRANT ALL ON TABLE "public"."business_trends" TO "service_role";



GRANT ALL ON SEQUENCE "public"."business_trends_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."business_trends_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."business_trends_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."call_analytics" TO "anon";
GRANT ALL ON TABLE "public"."call_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."call_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."call_insights" TO "anon";
GRANT ALL ON TABLE "public"."call_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."call_insights" TO "service_role";



GRANT ALL ON TABLE "public"."call_transcriptions" TO "anon";
GRANT ALL ON TABLE "public"."call_transcriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."call_transcriptions" TO "service_role";



GRANT ALL ON TABLE "public"."chat_logs" TO "anon";
GRANT ALL ON TABLE "public"."chat_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_logs" TO "service_role";



GRANT ALL ON TABLE "public"."client_insights" TO "anon";
GRANT ALL ON TABLE "public"."client_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."client_insights" TO "service_role";



GRANT ALL ON SEQUENCE "public"."client_insights_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."client_insights_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."client_insights_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."clients_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."clients_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."clients_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."companies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."companies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."companies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."company_partners" TO "anon";
GRANT ALL ON TABLE "public"."company_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."company_partners" TO "service_role";



GRANT ALL ON TABLE "public"."deliverable_master" TO "anon";
GRANT ALL ON TABLE "public"."deliverable_master" TO "authenticated";
GRANT ALL ON TABLE "public"."deliverable_master" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deliverable_master_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deliverable_master_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deliverable_master_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deliverables" TO "anon";
GRANT ALL ON TABLE "public"."deliverables" TO "authenticated";
GRANT ALL ON TABLE "public"."deliverables" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deliverables_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deliverables_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deliverables_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."department_instructions" TO "anon";
GRANT ALL ON TABLE "public"."department_instructions" TO "authenticated";
GRANT ALL ON TABLE "public"."department_instructions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."department_instructions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."department_instructions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."department_instructions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."departments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."departments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."departments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."designations" TO "anon";
GRANT ALL ON TABLE "public"."designations" TO "authenticated";
GRANT ALL ON TABLE "public"."designations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."designations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."designations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."designations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."email_notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."employee_companies" TO "anon";
GRANT ALL ON TABLE "public"."employee_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_companies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."employee_companies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."employee_companies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."employee_companies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON SEQUENCE "public"."employees_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."employees_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."employees_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."follow_up_auditions" TO "anon";
GRANT ALL ON TABLE "public"."follow_up_auditions" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_up_auditions" TO "service_role";



GRANT ALL ON TABLE "public"."instruction_approvals" TO "anon";
GRANT ALL ON TABLE "public"."instruction_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."instruction_approvals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."instruction_approvals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."instruction_approvals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."instruction_approvals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lead_drafts" TO "anon";
GRANT ALL ON TABLE "public"."lead_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_drafts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lead_drafts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lead_drafts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lead_drafts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lead_followups" TO "anon";
GRANT ALL ON TABLE "public"."lead_followups" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_followups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lead_followups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lead_followups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lead_followups_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lead_sources" TO "anon";
GRANT ALL ON TABLE "public"."lead_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_sources" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lead_sources_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lead_sources_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lead_sources_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lead_task_performance" TO "anon";
GRANT ALL ON TABLE "public"."lead_task_performance" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_task_performance" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lead_task_performance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lead_task_performance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lead_task_performance_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."management_insights" TO "anon";
GRANT ALL ON TABLE "public"."management_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."management_insights" TO "service_role";



GRANT ALL ON SEQUENCE "public"."management_insights_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."management_insights_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."management_insights_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items" TO "anon";
GRANT ALL ON TABLE "public"."menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."menu_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."menu_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."menu_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items_tracking" TO "anon";
GRANT ALL ON TABLE "public"."menu_items_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items_tracking" TO "service_role";



GRANT ALL ON SEQUENCE "public"."menu_items_tracking_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."menu_items_tracking_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."menu_items_tracking_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ml_model_performance" TO "anon";
GRANT ALL ON TABLE "public"."ml_model_performance" TO "authenticated";
GRANT ALL ON TABLE "public"."ml_model_performance" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ml_model_performance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ml_model_performance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ml_model_performance_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_accounts" TO "anon";
GRANT ALL ON TABLE "public"."user_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."mv_user_roles_fast" TO "anon";
GRANT ALL ON TABLE "public"."mv_user_roles_fast" TO "authenticated";
GRANT ALL ON TABLE "public"."mv_user_roles_fast" TO "service_role";



GRANT ALL ON TABLE "public"."notification_batches" TO "anon";
GRANT ALL ON TABLE "public"."notification_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_batches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notification_batches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_batches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_batches_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification_engagement" TO "anon";
GRANT ALL ON TABLE "public"."notification_engagement" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_engagement" TO "service_role";



GRANT ALL ON TABLE "public"."notification_patterns" TO "anon";
GRANT ALL ON TABLE "public"."notification_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_patterns" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."notification_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."notification_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notification_recipients" TO "anon";
GRANT ALL ON TABLE "public"."notification_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."notification_rules" TO "anon";
GRANT ALL ON TABLE "public"."notification_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_rules" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON SEQUENCE "public"."partners_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."partners_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."partners_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."personalization_learning" TO "anon";
GRANT ALL ON TABLE "public"."personalization_learning" TO "authenticated";
GRANT ALL ON TABLE "public"."personalization_learning" TO "service_role";



GRANT ALL ON TABLE "public"."post_sale_confirmations" TO "anon";
GRANT ALL ON TABLE "public"."post_sale_confirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."post_sale_confirmations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_sale_confirmations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_sale_confirmations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_sale_confirmations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_sales_workflows" TO "anon";
GRANT ALL ON TABLE "public"."post_sales_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."post_sales_workflows" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_sales_workflows_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_sales_workflows_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_sales_workflows_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."query_performance_logs" TO "anon";
GRANT ALL ON TABLE "public"."query_performance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."query_performance_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."query_performance_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."query_performance_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."query_performance_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_approvals" TO "anon";
GRANT ALL ON TABLE "public"."quotation_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_approvals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quotation_approvals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quotation_approvals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quotation_approvals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_events" TO "anon";
GRANT ALL ON TABLE "public"."quotation_events" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quotation_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quotation_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quotation_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_predictions" TO "anon";
GRANT ALL ON TABLE "public"."quotation_predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_predictions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quotation_predictions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quotation_predictions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quotation_predictions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_revisions" TO "anon";
GRANT ALL ON TABLE "public"."quotation_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_revisions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quotation_revisions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quotation_revisions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quotation_revisions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_workflow_history" TO "anon";
GRANT ALL ON TABLE "public"."quotation_workflow_history" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_workflow_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quotation_workflow_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quotation_workflow_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quotation_workflow_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quotations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quotations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quotations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quote_components" TO "anon";
GRANT ALL ON TABLE "public"."quote_components" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_components" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quote_components_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quote_components_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quote_components_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quote_deliverables_snapshot" TO "anon";
GRANT ALL ON TABLE "public"."quote_deliverables_snapshot" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_deliverables_snapshot" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quote_deliverables_snapshot_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quote_deliverables_snapshot_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quote_deliverables_snapshot_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quote_services_snapshot" TO "anon";
GRANT ALL ON TABLE "public"."quote_services_snapshot" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_services_snapshot" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quote_services_snapshot_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quote_services_snapshot_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quote_services_snapshot_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."recent_business_notifications" TO "anon";
GRANT ALL ON TABLE "public"."recent_business_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_business_notifications" TO "service_role";
GRANT SELECT ON TABLE "public"."recent_business_notifications" TO PUBLIC;



GRANT ALL ON TABLE "public"."rejected_leads_view" TO "anon";
GRANT ALL ON TABLE "public"."rejected_leads_view" TO "authenticated";
GRANT ALL ON TABLE "public"."rejected_leads_view" TO "service_role";



GRANT ALL ON TABLE "public"."revenue_forecasts" TO "anon";
GRANT ALL ON TABLE "public"."revenue_forecasts" TO "authenticated";
GRANT ALL ON TABLE "public"."revenue_forecasts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."revenue_forecasts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."revenue_forecasts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."revenue_forecasts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_menu_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_menu_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_menu_permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."role_menu_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_menu_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_menu_permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_activities" TO "anon";
GRANT ALL ON TABLE "public"."sales_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_activities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_activities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_activities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_activities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."sales_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_performance_metrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_performance_metrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_performance_metrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_performance_metrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_team_members" TO "anon";
GRANT ALL ON TABLE "public"."sales_team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_team_members" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_team_members_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_team_members_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_team_members_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sequence_rules" TO "anon";
GRANT ALL ON TABLE "public"."sequence_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."sequence_rules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sequence_rules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sequence_rules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sequence_rules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sequence_steps" TO "anon";
GRANT ALL ON TABLE "public"."sequence_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."sequence_steps" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sequence_steps_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sequence_steps_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sequence_steps_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."service_packages" TO "anon";
GRANT ALL ON TABLE "public"."service_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."service_packages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."service_packages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."service_packages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."service_packages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."system_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."system_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."system_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."system_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_generation_log" TO "anon";
GRANT ALL ON TABLE "public"."task_generation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."task_generation_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_generation_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_generation_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_generation_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."task_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."task_performance_metrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_performance_metrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_performance_metrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_performance_metrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_sequence_templates" TO "anon";
GRANT ALL ON TABLE "public"."task_sequence_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."task_sequence_templates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_sequence_templates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_sequence_templates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_sequence_templates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_status_history" TO "anon";
GRANT ALL ON TABLE "public"."task_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."task_status_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_status_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_status_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_status_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."team_performance_trends" TO "anon";
GRANT ALL ON TABLE "public"."team_performance_trends" TO "authenticated";
GRANT ALL ON TABLE "public"."team_performance_trends" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_performance_trends_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_performance_trends_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_performance_trends_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_accounts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_accounts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_accounts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_history" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_ai_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_ai_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ai_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_behavior_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_behavior_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_behavior_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_engagement_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_engagement_summary" TO "anon";
GRANT ALL ON TABLE "public"."user_engagement_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."user_engagement_summary" TO "service_role";



GRANT ALL ON TABLE "public"."user_id_mapping" TO "anon";
GRANT ALL ON TABLE "public"."user_id_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."user_id_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."user_menu_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_menu_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_menu_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_notification_summary" TO "anon";
GRANT ALL ON TABLE "public"."user_notification_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notification_summary" TO "service_role";
GRANT SELECT ON TABLE "public"."user_notification_summary" TO PUBLIC;



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_package_deliverables" TO "anon";
GRANT ALL ON TABLE "public"."v_package_deliverables" TO "authenticated";
GRANT ALL ON TABLE "public"."v_package_deliverables" TO "service_role";



GRANT ALL ON TABLE "public"."v_package_services" TO "anon";
GRANT ALL ON TABLE "public"."v_package_services" TO "authenticated";
GRANT ALL ON TABLE "public"."v_package_services" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_config" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_config" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_config" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_messages" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_templates" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_templates" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
