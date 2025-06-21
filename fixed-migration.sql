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
    (deliverable_item->>'id')::INTEGER as deliverable_id,
    COALESCE((deliverable_item->>'quantity')::INTEGER, 1) as quantity,
    COALESCE(qe.selected_package, 'basic') as package_type,
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN COALESCE(d.basic_total_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN COALESCE(d.premium_total_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN COALESCE(d.elite_total_price, 0)
        ELSE COALESCE(d.basic_total_price, 0)
    END as unit_price,
    COALESCE((deliverable_item->>'quantity')::INTEGER, 1) * 
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN COALESCE(d.basic_total_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN COALESCE(d.premium_total_price, 0)
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN COALESCE(d.elite_total_price, 0)
        ELSE COALESCE(d.basic_total_price, 0)
    END as total_price,
    'pending' as status
FROM quotation_events qe
CROSS JOIN LATERAL jsonb_array_elements(qe.selected_deliverables) AS deliverable_item
LEFT JOIN deliverables d ON d.id = (deliverable_item->>'id')::INTEGER
WHERE jsonb_array_length(qe.selected_deliverables) > 0;

-- Verify migration results
SELECT 'Services migrated:' as info, COUNT(*) as count FROM quotation_services;
SELECT 'Deliverables migrated:' as info, COUNT(*) as count FROM quotation_deliverables; 