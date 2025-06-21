-- Create missing deliverables that are referenced in quotations
-- This fixes the foreign key constraint violation

-- Insert deliverable ID 2
INSERT INTO deliverables (
    id,
    deliverable_name,
    basic_price,
    premium_price,
    elite_price,
    status
) VALUES (
    2,
    'Digital Gallery',
    8000.00,
    12000.00,
    18000.00,
    'active'
);

-- Insert deliverable ID 3  
INSERT INTO deliverables (
    id,
    deliverable_name,
    basic_price,
    premium_price,
    elite_price,
    status
) VALUES (
    3,
    'Photo Album',
    5000.00,
    8000.00,
    12000.00,
    'active'
);

-- Verify deliverables were created
SELECT 'Deliverables created:' as info, COUNT(*) as count FROM deliverables;
SELECT id, deliverable_name, basic_price, premium_price, elite_price FROM deliverables; 