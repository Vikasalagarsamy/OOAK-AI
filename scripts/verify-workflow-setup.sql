-- Verification script for quotation workflow setup
-- Run this after executing setup-quotation-workflow.sql to verify everything was created correctly

-- 1. Check if workflow columns were added to quotations table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quotations' 
  AND column_name IN ('workflow_status', 'client_verbal_confirmation_date', 'payment_received_date', 'payment_amount', 'payment_reference', 'confirmation_required')
ORDER BY column_name;

-- 2. Check if quotation_approvals table exists with correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'quotation_approvals'
ORDER BY ordinal_position;

-- 3. Check if post_sale_confirmations table exists with correct structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_sale_confirmations'
ORDER BY ordinal_position;

-- 4. Check if workflow analytics view exists
SELECT COUNT(*) as view_exists
FROM information_schema.views 
WHERE table_name = 'quotation_workflow_analytics';

-- 5. Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('quotations', 'quotation_approvals', 'post_sale_confirmations')
  AND indexname LIKE 'idx_%';

-- 6. Check if triggers were created
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_update_quotation_approval_timestamp', 'trigger_update_quotation_workflow_status');

-- 7. Verify actual quotations table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quotations' 
ORDER BY ordinal_position;

-- 8. Test the analytics view structure
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'quotation_workflow_analytics'
ORDER BY ordinal_position;

-- 9. Test inserting a sample workflow record (optional)
-- Uncomment the lines below to test the workflow tables
/*
-- Insert a sample approval record (adjust quotation_id and user_id as needed)
INSERT INTO quotation_approvals (quotation_id, approver_user_id, approval_status, comments) 
VALUES (1, '550e8400-e29b-41d4-a716-446655440000', 'pending', 'Test approval record');

-- Check if the record was inserted
SELECT * FROM quotation_approvals WHERE comments = 'Test approval record';

-- Clean up test record
DELETE FROM quotation_approvals WHERE comments = 'Test approval record';
*/

SELECT 'Workflow setup verification complete!' as status; 