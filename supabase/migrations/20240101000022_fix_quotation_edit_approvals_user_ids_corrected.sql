-- Fix quotation edit approvals table to use integer employee IDs instead of UUIDs
-- This aligns with the existing employee system

-- Step 1: Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own edit requests" ON quotation_edit_approvals;
DROP POLICY IF EXISTS "Users can create edit requests" ON quotation_edit_approvals;
DROP POLICY IF EXISTS "Approvers can update requests" ON quotation_edit_approvals;

-- Step 2: Drop existing foreign key constraints if they exist
ALTER TABLE quotation_edit_approvals DROP CONSTRAINT IF EXISTS quotation_edit_approvals_requested_by_fkey;
ALTER TABLE quotation_edit_approvals DROP CONSTRAINT IF EXISTS quotation_edit_approvals_approved_by_fkey;

-- Step 3: Change requested_by and approved_by columns to integer (employee IDs)
-- First, we need to handle the conversion properly
ALTER TABLE quotation_edit_approvals 
ALTER COLUMN requested_by TYPE INTEGER USING (
    CASE 
        WHEN requested_by::text ~ '^[0-9]+$' THEN requested_by::text::integer
        ELSE NULL
    END
);

ALTER TABLE quotation_edit_approvals 
ALTER COLUMN approved_by TYPE INTEGER USING (
    CASE 
        WHEN approved_by::text ~ '^[0-9]+$' THEN approved_by::text::integer
        ELSE NULL
    END
);

-- Step 4: Add foreign key constraints to employees table
ALTER TABLE quotation_edit_approvals 
ADD CONSTRAINT quotation_edit_approvals_requested_by_fkey 
FOREIGN KEY (requested_by) REFERENCES employees(id);

ALTER TABLE quotation_edit_approvals 
ADD CONSTRAINT quotation_edit_approvals_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES employees(id);

-- Step 5: Recreate RLS policies to work with integer employee IDs
-- Policy: Users can view their own requests and approvers can view all pending requests
CREATE POLICY "Users can view own edit requests" ON quotation_edit_approvals
    FOR SELECT USING (
        requested_by IN (
            SELECT e.id FROM employees e
            JOIN user_accounts ua ON e.id = ua.employee_id
            WHERE ua.id = auth.uid()::text::integer
        ) OR 
        EXISTS (
            SELECT 1 FROM employees e
            JOIN user_accounts ua ON e.id = ua.employee_id
            WHERE ua.id = auth.uid()::text::integer
            AND e.job_title IN ('Sales Head', 'Administrator')
        )
    );

-- Policy: Users can create edit requests for quotations they have access to
CREATE POLICY "Users can create edit requests" ON quotation_edit_approvals
    FOR INSERT WITH CHECK (
        requested_by IN (
            SELECT e.id FROM employees e
            JOIN user_accounts ua ON e.id = ua.employee_id
            WHERE ua.id = auth.uid()::text::integer
        ) AND
        EXISTS (
            SELECT 1 FROM quotations 
            WHERE id = quotation_id 
            AND (created_by = auth.uid()::text OR assigned_to IN (
                SELECT e.employee_id FROM employees e
                JOIN user_accounts ua ON e.id = ua.employee_id
                WHERE ua.id = auth.uid()::text::integer
            ))
        )
    );

-- Policy: Only Sales Head and Administrators can approve/reject requests
CREATE POLICY "Approvers can update requests" ON quotation_edit_approvals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN user_accounts ua ON e.id = ua.employee_id
            WHERE ua.id = auth.uid()::text::integer
            AND e.job_title IN ('Sales Head', 'Administrator')
        )
    );

-- Add comment
COMMENT ON TABLE quotation_edit_approvals IS 'Tracks quotation edit approval requests with integer employee IDs for compatibility'; 