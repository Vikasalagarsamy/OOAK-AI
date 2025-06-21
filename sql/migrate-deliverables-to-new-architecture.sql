-- Migration Script: Existing Deliverables to New Architecture
-- This script migrates data from the old `deliverables` table to the new separated architecture

-- =====================================================
-- 1. CREATE NEW TABLES (if not already created)
-- =====================================================
-- Run the create-deliverable-architecture.sql first

-- =====================================================
-- 2. MIGRATE DELIVERABLE CATALOG DATA
-- =====================================================

-- Insert unique deliverables into catalog table
INSERT INTO deliverable_catalog (
    deliverable_name,
    deliverable_category,
    deliverable_type,
    basic_price,
    premium_price,
    elite_price,
    package_included,
    status,
    created_date,
    created_by
)
SELECT DISTINCT
    d.deliverable_name,
    d.deliverable_cat as deliverable_category,
    d.deliverable_type,
    COALESCE(MAX(d.basic_price), 0) as basic_price,
    COALESCE(MAX(d.premium_price), 0) as premium_price,
    COALESCE(MAX(d.elite_price), 0) as elite_price,
    COALESCE(
        (SELECT package_included FROM deliverables d2 
         WHERE d2.deliverable_name = d.deliverable_name 
         AND d2.deliverable_cat = d.deliverable_cat 
         AND d2.deliverable_type = d.deliverable_type 
         AND d2.package_included IS NOT NULL 
         LIMIT 1),
        '{"basic": false, "premium": false, "elite": false}'::jsonb
    ) as package_included,
    1 as status,
    MIN(d.created_date) as created_date,
    MIN(d.created_by) as created_by
FROM deliverables d
WHERE d.status = 1
  AND d.deliverable_name IS NOT NULL
  AND d.deliverable_name != ''
GROUP BY d.deliverable_name, d.deliverable_cat, d.deliverable_type
ON CONFLICT (deliverable_name, deliverable_category, deliverable_type) DO NOTHING;

-- =====================================================
-- 3. MIGRATE WORKFLOW DATA
-- =====================================================

-- Insert workflow processes
INSERT INTO deliverable_workflows (
    deliverable_catalog_id,
    process_name,
    sort_order,
    has_customer,
    has_employee,
    has_qc,
    has_vendor,
    timing_type,
    tat,
    tat_value,
    buffer,
    skippable,
    has_download_option,
    has_task_process,
    has_upload_folder_path,
    process_starts_from,
    on_start_template,
    on_complete_template,
    on_correction_template,
    employee,
    input_names,
    link,
    stream,
    stage,
    process_basic_price,
    process_premium_price,
    process_elite_price,
    status,
    created_date,
    created_by
)
SELECT 
    dc.id as deliverable_catalog_id,
    d.process_name,
    COALESCE(d.sort_order, 1) as sort_order,
    COALESCE(d.has_customer, false) as has_customer,
    COALESCE(d.has_employee, false) as has_employee,
    COALESCE(d.has_qc, false) as has_qc,
    COALESCE(d.has_vendor, false) as has_vendor,
    COALESCE(d.timing_type, 'days') as timing_type,
    d.tat,
    d.tat_value,
    d.buffer,
    COALESCE(d.skippable, false) as skippable,
    COALESCE(d.has_download_option, false) as has_download_option,
    COALESCE(d.has_task_process, true) as has_task_process,
    COALESCE(d.has_upload_folder_path, false) as has_upload_folder_path,
    COALESCE(d.process_starts_from, 1) as process_starts_from,
    d.on_start_template,
    d.on_complete_template,
    d.on_correction_template,
    COALESCE(d.employee, '[]'::jsonb) as employee,
    COALESCE(d.input_names, '[]'::jsonb) as input_names,
    d.link,
    d.stream,
    d.stage,
    -- Use process-specific pricing if different from catalog pricing
    CASE 
        WHEN d.basic_price != dc.basic_price THEN d.basic_price 
        ELSE NULL 
    END as process_basic_price,
    CASE 
        WHEN d.premium_price != dc.premium_price THEN d.premium_price 
        ELSE NULL 
    END as process_premium_price,
    CASE 
        WHEN d.elite_price != dc.elite_price THEN d.elite_price 
        ELSE NULL 
    END as process_elite_price,
    d.status,
    d.created_date,
    d.created_by
FROM deliverables d
JOIN deliverable_catalog dc ON (
    dc.deliverable_name = d.deliverable_name 
    AND dc.deliverable_category = d.deliverable_cat 
    AND dc.deliverable_type = d.deliverable_type
)
WHERE d.status = 1
  AND d.process_name IS NOT NULL
  AND d.process_name != ''
ORDER BY d.deliverable_name, d.sort_order;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Check migration results
SELECT 
    'Catalog Count' as table_name,
    COUNT(*) as record_count
FROM deliverable_catalog

UNION ALL

SELECT 
    'Workflow Count' as table_name,
    COUNT(*) as record_count
FROM deliverable_workflows

UNION ALL

SELECT 
    'Original Deliverables Count' as table_name,
    COUNT(*) as record_count
FROM deliverables 
WHERE status = 1;

-- Show catalog summary with workflow counts
SELECT 
    dc.deliverable_name,
    dc.deliverable_category,
    dc.deliverable_type,
    dc.basic_price,
    dc.premium_price,
    dc.elite_price,
    COUNT(dw.id) as workflow_count
FROM deliverable_catalog dc
LEFT JOIN deliverable_workflows dw ON dc.id = dw.deliverable_catalog_id AND dw.status = 1
GROUP BY dc.id, dc.deliverable_name, dc.deliverable_category, dc.deliverable_type, dc.basic_price, dc.premium_price, dc.elite_price
ORDER BY dc.deliverable_name;

-- =====================================================
-- 5. BACKUP ORIGINAL TABLE (Optional)
-- =====================================================

-- Create backup of original table
CREATE TABLE IF NOT EXISTS deliverables_backup AS 
SELECT * FROM deliverables;

-- Add comment to backup table
COMMENT ON TABLE deliverables_backup IS 
'Backup of original deliverables table before migration to new architecture';

-- =====================================================
-- 6. POST-MIGRATION CLEANUP (Run after verification)
-- =====================================================

-- After verifying the migration is successful, you can optionally:
-- 1. Rename the old table to make it inactive
-- ALTER TABLE deliverables RENAME TO deliverables_old;

-- 2. Or drop it entirely (be very careful!)
-- DROP TABLE deliverables;

-- Note: Don't run cleanup until you've thoroughly tested the new system! 