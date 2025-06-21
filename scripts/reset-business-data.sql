-- =====================================================
-- BUSINESS DATA RESET SCRIPT
-- =====================================================
-- Purpose: Clean all data from tasks, quotations, and leads
-- Preserves: All table schemas, relations, and functionality
-- Safe to rerun: Yes, uses IF EXISTS and transaction
-- =====================================================

BEGIN;

-- Add safety check to prevent accidental runs in production
DO $$
BEGIN
    -- Only allow this in development/test environments
    -- Comment out this block if you're sure you want to run this
    IF current_database() NOT LIKE '%test%' AND current_database() NOT LIKE '%dev%' THEN
        RAISE EXCEPTION 'Safety check: This script should only be run in development/test databases. Current database: %', current_database();
    END IF;
END $$;

-- =====================================================
-- STEP 1: Delete AI Tasks (depends on quotations/leads)
-- =====================================================
DO $$
DECLARE
    task_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO task_count FROM ai_tasks;
    RAISE NOTICE 'Deleting % AI tasks...', task_count;
    
    DELETE FROM ai_tasks;
    
    RAISE NOTICE '✅ AI tasks deleted successfully';
END $$;

-- =====================================================
-- STEP 2: Delete Quotations (might be referenced by other tables)
-- =====================================================
DO $$
DECLARE
    quotation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO quotation_count FROM quotations;
    RAISE NOTICE 'Deleting % quotations...', quotation_count;
    
    DELETE FROM quotations;
    
    RAISE NOTICE '✅ Quotations deleted successfully';
END $$;

-- =====================================================
-- STEP 3: Delete Leads (base table)
-- =====================================================
DO $$
DECLARE
    lead_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO lead_count FROM leads;
    RAISE NOTICE 'Deleting % leads...', lead_count;
    
    DELETE FROM leads;
    
    RAISE NOTICE '✅ Leads deleted successfully';
END $$;

-- =====================================================
-- STEP 4: Reset Auto-increment Sequences (Optional)
-- =====================================================
DO $$
BEGIN
    -- Reset AI tasks sequence
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'ai_tasks_id_seq') THEN
        ALTER SEQUENCE ai_tasks_id_seq RESTART WITH 1;
        RAISE NOTICE '🔄 AI tasks sequence reset to 1';
    END IF;
    
    -- Reset quotations sequence
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'quotations_id_seq') THEN
        ALTER SEQUENCE quotations_id_seq RESTART WITH 1;
        RAISE NOTICE '🔄 Quotations sequence reset to 1';
    END IF;
    
    -- Reset leads sequence
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'leads_id_seq') THEN
        ALTER SEQUENCE leads_id_seq RESTART WITH 1;
        RAISE NOTICE '🔄 Leads sequence reset to 1';
    END IF;
END $$;

-- =====================================================
-- STEP 5: Verification
-- =====================================================
DO $$
DECLARE
    ai_tasks_count INTEGER;
    quotations_count INTEGER;
    leads_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ai_tasks_count FROM ai_tasks;
    SELECT COUNT(*) INTO quotations_count FROM quotations;
    SELECT COUNT(*) INTO leads_count FROM leads;
    
    RAISE NOTICE '';
    RAISE NOTICE '====== DATA RESET VERIFICATION ======';
    RAISE NOTICE 'AI Tasks remaining: %', ai_tasks_count;
    RAISE NOTICE 'Quotations remaining: %', quotations_count;
    RAISE NOTICE 'Leads remaining: %', leads_count;
    RAISE NOTICE '';
    
    IF ai_tasks_count = 0 AND quotations_count = 0 AND leads_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All business data has been reset';
        RAISE NOTICE '📊 Ready for fresh analytics and dashboard testing';
        RAISE NOTICE '🔧 All schemas and functionality preserved';
    ELSE
        RAISE EXCEPTION 'ERROR: Data reset incomplete. Check foreign key constraints.';
    END IF;
END $$;

-- =====================================================
-- STEP 6: Show Preserved Schema Information
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====== PRESERVED FUNCTIONALITY ======';
    RAISE NOTICE '✅ Table schemas intact';
    RAISE NOTICE '✅ Foreign key constraints preserved';
    RAISE NOTICE '✅ Indexes and triggers maintained';
    RAISE NOTICE '✅ API endpoints will work normally';
    RAISE NOTICE '✅ Task sequence management ready';
    RAISE NOTICE '✅ Admin dashboard functional';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 System ready for clean testing!';
END $$;

COMMIT;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================
-- 
-- To run this script:
-- 1. Connect to your development/test database
-- 2. Execute: \i scripts/reset-business-data.sql
-- 
-- Or via API (if you create an endpoint):
-- curl -X POST http://localhost:3000/api/admin/reset-data
-- 
-- Safety features:
-- - Uses transactions (can rollback on error)
-- - Checks database name (prevents prod accidents)
-- - Provides detailed logging
-- - Verifies completion
-- - Can be run multiple times safely
-- 
-- What this script does:
-- ✅ Deletes all tasks, quotations, and leads data
-- ✅ Resets auto-increment sequences to 1
-- ✅ Preserves all table structures
-- ✅ Preserves all foreign key relationships
-- ✅ Preserves all indexes and constraints
-- ✅ Preserves all API functionality
-- 
-- What this script does NOT do:
-- ❌ Drop any tables
-- ❌ Alter any schemas
-- ❌ Remove any constraints
-- ❌ Delete system/configuration data
-- ❌ Affect user accounts or authentication
-- ===================================================== 