-- Create missing deliverables with ALL required columns
-- Fixed to include deliverable_cat, deliverable_type, and process_name

-- Insert deliverable ID 2 - Digital Gallery
INSERT INTO deliverables (
    id,
    deliverable_cat,
    deliverable_type,
    deliverable_name,
    process_name,
    basic_price,
    premium_price,
    elite_price
) VALUES (
    2,
    'Main',
    'Photo',
    'Digital Gallery',
    'digital_gallery_processing',
    8000.00,
    12000.00,
    18000.00
);

-- Insert deliverable ID 3 - Photo Album  
INSERT INTO deliverables (
    id,
    deliverable_cat,
    deliverable_type,
    deliverable_name,
    process_name,
    basic_price,
    premium_price,
    elite_price
) VALUES (
    3,
    'Optional',
    'Photo',
    'Photo Album',
    'photo_album_processing',
    5000.00,
    8000.00,
    12000.00
);

-- Verify deliverables were created
SELECT 'Deliverables created:' as info, COUNT(*) as count FROM deliverables;
SELECT id, deliverable_cat, deliverable_type, deliverable_name, process_name, basic_price, premium_price, elite_price FROM deliverables; 