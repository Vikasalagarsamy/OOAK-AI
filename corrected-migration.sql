-- MIGRATE SERVICES from quotation_events to quotation_services
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
    (service_item->>'id')::INTEGER as service_id,
    COALESCE((service_item->>'quantity')::INTEGER, 1) as quantity,
    COALESCE(qe.selected_package, 'basic') as package_type,
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN s.basic_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN s.premium_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN s.elite_price
        ELSE s.basic_price
    END as unit_price,
    COALESCE((service_item->>'quantity')::INTEGER, 1) * 
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN s.basic_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN s.premium_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN s.elite_price
        ELSE s.basic_price
    END as total_price,
    'active' as status
FROM quotation_events qe
CROSS JOIN LATERAL jsonb_array_elements(qe.selected_services) AS service_item
JOIN services s ON s.id = (service_item->>'id')::INTEGER
WHERE jsonb_array_length(qe.selected_services) > 0;

-- MIGRATE DELIVERABLES from quotation_events to quotation_deliverables  
INSERT INTO quotation_deliverables (
    quotation_id, 
    event_id, 
    service_id,
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
    -- For migration: Associate deliverables with the first service in the event
    -- In future quotations, this will be properly specified
    CASE 
        WHEN jsonb_array_length(qe.selected_services) > 0 THEN 
            (qe.selected_services->0->>'id')::INTEGER
        ELSE NULL
    END as service_id,
    (deliverable_item->>'id')::INTEGER as deliverable_id,
    COALESCE((deliverable_item->>'quantity')::INTEGER, 1) as quantity,
    COALESCE(qe.selected_package, 'basic') as package_type,
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN COALESCE(d.basic_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN COALESCE(d.premium_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN COALESCE(d.elite_price, 0)
        ELSE COALESCE(d.basic_price, 0)
    END as unit_price,
    COALESCE((deliverable_item->>'quantity')::INTEGER, 1) * 
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN COALESCE(d.basic_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN COALESCE(d.premium_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN COALESCE(d.elite_price, 0)
        ELSE COALESCE(d.basic_price, 0)
    END as total_price,
    'quoted' as status
FROM quotation_events qe
CROSS JOIN LATERAL jsonb_array_elements(qe.selected_deliverables) AS deliverable_item
LEFT JOIN deliverables d ON d.id = (deliverable_item->>'id')::INTEGER
WHERE jsonb_array_length(qe.selected_deliverables) > 0;

-- Verify migration results
SELECT 'Services migrated:' as info, COUNT(*) as count FROM quotation_services;
SELECT 'Deliverables migrated:' as info, COUNT(*) as count FROM quotation_deliverables;

-- Show migrated data
SELECT 'MIGRATED SERVICES:' as section;
SELECT 
    qs.quotation_id,
    qs.service_id,
    s.servicename,
    qs.quantity,
    qs.package_type,
    qs.unit_price,
    qs.total_price,
    qs.status
FROM quotation_services qs
JOIN services s ON s.id = qs.service_id;

SELECT 'MIGRATED DELIVERABLES:' as section;
SELECT 
    qd.quotation_id,
    qd.service_id,
    qd.deliverable_id,
    COALESCE(d.deliverable_name, 'Unknown') as deliverable_name,
    COALESCE(s.servicename, 'No Service') as service_name,
    qd.quantity,
    qd.package_type,
    qd.unit_price,
    qd.total_price,
    qd.status
FROM quotation_deliverables qd
LEFT JOIN deliverables d ON d.id = qd.deliverable_id
LEFT JOIN services s ON s.id = qd.service_id; 