-- Test Data for Sales Dashboard Verification
-- This script adds sample data to test that the sales dashboard shows real-time data

-- Add sample leads
INSERT INTO leads (lead_number, client_name, phone_number, email, lead_source, status, budget_range, event_date, event_type, venue, description, created_at) VALUES
('LEAD-2025-001', 'Rajesh Kumar', '+91-9876543210', 'rajesh@example.com', 'Website', 'UNASSIGNED', '50000-100000', '2025-03-15', 'Wedding', 'Grand Palace Hotel', 'Traditional South Indian wedding photography', NOW() - INTERVAL '5 days'),
('LEAD-2025-002', 'Priya Sharma', '+91-8765432109', 'priya@example.com', 'Instagram', 'WON', '100000-200000', '2025-04-20', 'Corporate Event', 'Tech Park Convention Center', 'Annual company conference photography', NOW() - INTERVAL '3 days'),
('LEAD-2025-003', 'Arjun Patel', '+91-7654321098', 'arjun@example.com', 'Referral', 'LOST', '30000-50000', '2025-02-28', 'Birthday', 'Home', 'Kids birthday party photography', NOW() - INTERVAL '2 days'),
('LEAD-2025-004', 'Sneha Reddy', '+91-6543210987', 'sneha@example.com', 'Facebook', 'IN_NEGOTIATION', '150000-300000', '2025-05-10', 'Wedding', 'Beach Resort', 'Destination wedding photography', NOW() - INTERVAL '1 day'),
('LEAD-2025-005', 'Vikram Singh', '+91-5432109876', 'vikram@example.com', 'WhatsApp', 'UNASSIGNED', '75000-125000', '2025-03-30', 'Engagement', 'Garden Venue', 'Pre-wedding and engagement shoot', NOW());

-- Add sample quotations (we'll get the lead IDs first)
-- Note: This assumes user ID 1 exists - you may need to adjust
DO $$
DECLARE
    lead1_id INTEGER;
    lead2_id INTEGER;
    lead4_id INTEGER;
    user_id UUID;
BEGIN
    -- Get the first user's ID (adjust as needed)
    SELECT id INTO user_id FROM auth.users LIMIT 1;
    
    -- Get lead IDs
    SELECT id INTO lead1_id FROM leads WHERE lead_number = 'LEAD-2025-001';
    SELECT id INTO lead2_id FROM leads WHERE lead_number = 'LEAD-2025-002';
    SELECT id INTO lead4_id FROM leads WHERE lead_number = 'LEAD-2025-004';
    
    -- Insert sample quotations
    INSERT INTO quotations (quotation_number, lead_id, client_name, total_amount, status, valid_until, created_by, created_at) VALUES
    ('QT-2025-001', lead1_id, 'Rajesh Kumar', 75000, 'sent', NOW() + INTERVAL '30 days', user_id, NOW() - INTERVAL '2 days'),
    ('QT-2025-002', lead2_id, 'Priya Sharma', 150000, 'approved', NOW() + INTERVAL '30 days', user_id, NOW() - INTERVAL '1 day'),
    ('QT-2025-003', lead4_id, 'Sneha Reddy', 200000, 'draft', NOW() + INTERVAL '30 days', user_id, NOW());
    
END $$;

-- Verify the data was inserted
SELECT 'Leads inserted:' as info, COUNT(*) as count FROM leads;
SELECT 'Quotations inserted:' as info, COUNT(*) as count FROM quotations;
SELECT 'Lead status distribution:' as info, status, COUNT(*) as count FROM leads GROUP BY status;
SELECT 'Quotation status distribution:' as info, status, COUNT(*) as count FROM quotations GROUP BY status; 