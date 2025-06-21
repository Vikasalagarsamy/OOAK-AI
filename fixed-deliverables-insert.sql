-- Create missing deliverables with the correct structure
-- Fixed to include required deliverable_cat column

-- Insert deliverable ID 2 - Digital Gallery
INSERT INTO deliverables (
    id,
    deliverable_cat,
    deliverable_name,
    basic_price,
    premium_price,
    elite_price
) VALUES (
    2,
    'digital',
    'Digital Gallery',
    8000.00,
    12000.00,
    18000.00
);

-- Insert deliverable ID 3 - Photo Album  
INSERT INTO deliverables (
    id,
    deliverable_cat,
    deliverable_name,
    basic_price,
    premium_price,
    elite_price
) VALUES (
    3,
    'physical',
    'Photo Album',
    5000.00,
    8000.00,
    12000.00
);

-- Verify deliverables were created
SELECT 'Deliverables created:' as info, COUNT(*) as count FROM deliverables;
SELECT id, deliverable_cat, deliverable_name, basic_price, premium_price, elite_price FROM deliverables; 