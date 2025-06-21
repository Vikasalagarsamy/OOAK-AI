-- Migrate existing quotation data from JSON arrays to dedicated junction tables
-- This preserves all existing quotation services and deliverables

-- First, let's see what data we're working with
SELECT 'Starting migration of quotation data...' as status;

-- 1. MIGRATE SERVICES from quotation_events.selected_services to quotation_services table
INSERT INTO quotation_services (
    quotation_id, 
    event_id, 
    service_id, 
    quantity, 
    package_type,
    unit_price,
    total_price,
    status
)
SELECT 
    qe.quotation_id,
    qe.id as event_id,
    (jsonb_array_elements(qe.selected_services)->>'id')::INTEGER as service_id,
    COALESCE((jsonb_array_elements(qe.selected_services)->>'quantity')::INTEGER, 1) as quantity,
    COALESCE(qe.selected_package, 'basic') as package_type,
    -- Calculate unit price based on package type
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN s.basic_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN s.premium_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN s.elite_price
        ELSE s.basic_price
    END as unit_price,
    -- Calculate total price
    COALESCE((jsonb_array_elements(qe.selected_services)->>'quantity')::INTEGER, 1) * 
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN s.basic_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN s.premium_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN s.elite_price
        ELSE s.basic_price
    END as total_price,
    'active' as status
FROM quotation_events qe
JOIN services s ON s.id = (jsonb_array_elements(qe.selected_services)->>'id')::INTEGER
WHERE jsonb_array_length(qe.selected_services) > 0;

-- 2. MIGRATE DELIVERABLES from quotation_events.selected_deliverables to quotation_deliverables table
INSERT INTO quotation_deliverables (
    quotation_id, 
    event_id, 
    deliverable_id, 
    quantity, 
    package_type,
    unit_price,
    total_price,
    status
)
SELECT 
    qe.quotation_id,
    qe.id as event_id,
    (jsonb_array_elements(qe.selected_deliverables)->>'id')::INTEGER as deliverable_id,
    COALESCE((jsonb_array_elements(qe.selected_deliverables)->>'quantity')::INTEGER, 1) as quantity,
    COALESCE(qe.selected_package, 'basic') as package_type,
    -- Calculate unit price based on package type (if deliverables exist)
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN COALESCE(d.basic_total_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN COALESCE(d.premium_total_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN COALESCE(d.elite_total_price, 0)
        ELSE COALESCE(d.basic_total_price, 0)
    END as unit_price,
    -- Calculate total price
    COALESCE((jsonb_array_elements(qe.selected_deliverables)->>'quantity')::INTEGER, 1) * 
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN COALESCE(d.basic_total_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN COALESCE(d.premium_total_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN COALESCE(d.elite_total_price, 0)
        ELSE COALESCE(d.basic_total_price, 0)
    END as total_price,
    'pending' as status
FROM quotation_events qe
LEFT JOIN deliverables d ON d.id = (jsonb_array_elements(qe.selected_deliverables)->>'id')::INTEGER
WHERE jsonb_array_length(qe.selected_deliverables) > 0;

-- 3. Show migration results
SELECT 'Migration completed! Summary:' as status;

SELECT 
    'Services migrated: ' || COUNT(*) as result 
FROM quotation_services;

SELECT 
    'Deliverables migrated: ' || COUNT(*) as result 
FROM quotation_deliverables;

-- 4. Verify migration by showing sample data
SELECT 'Sample migrated services:' as info;
SELECT 
    qs.quotation_id,
    q.quotation_number,
    s.servicename,
    qs.quantity,
    qs.package_type,
    qs.unit_price,
    qs.total_price
FROM quotation_services qs
JOIN quotations q ON q.id = qs.quotation_id
JOIN services s ON s.id = qs.service_id
LIMIT 5;

SELECT 'Sample migrated deliverables:' as info;
SELECT 
    qd.quotation_id,
    q.quotation_number,
    COALESCE(d.deliverable_name, 'Unknown Deliverable (ID: ' || qd.deliverable_id || ')') as deliverable_name,
    qd.quantity,
    qd.package_type,
    qd.unit_price,
    qd.total_price
FROM quotation_deliverables qd
JOIN quotations q ON q.id = qd.quotation_id
LEFT JOIN deliverables d ON d.id = qd.deliverable_id
LIMIT 5;

SELECT 'SUCCESS: Migration completed successfully!' as final_status; 