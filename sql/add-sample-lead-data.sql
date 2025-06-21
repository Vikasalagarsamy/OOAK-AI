-- Add sample lead data to test the new columns and API functionality
-- This will create realistic lead records for testing

-- Insert sample leads with all the new fields
INSERT INTO leads (
  lead_number,
  client_name,
  email,
  phone,
  company_id,
  branch_id,
  status,
  assigned_to,
  lead_source,
  location,
  notes,
  bride_name,
  groom_name,
  priority,
  expected_value,
  last_contact_date,
  next_follow_up_date,
  conversion_stage,
  lead_score,
  tags,
  budget_range,
  wedding_date,
  venue_preference,
  guest_count,
  description,
  created_at
) VALUES 
-- High priority wedding lead
(
  'LD2024001',
  'Priya Sharma',
  'priya.sharma@gmail.com',
  '+91-9876543210',
  1,
  1,
  'NEW',
  3, -- Pooja Karthikeyan
  'Instagram',
  'Mumbai',
  'Contacted through Instagram. Interested in premium wedding package.',
  'Priya Sharma',
  'Raj Patel',
  'urgent',
  150000.00,
  NULL,
  NOW() + INTERVAL '2 hours',
  'new',
  85,
  ARRAY['wedding', 'premium', 'instagram'],
  '100k-200k',
  '2024-12-15',
  'Beach Resort, Goa',
  250,
  'Premium wedding package for 250 guests. Beach wedding in Goa. High budget client, very interested.',
  NOW() - INTERVAL '1 hour'
),

-- Medium priority corporate event
(
  'LD2024002',
  'Tech Solutions Pvt Ltd',
  'events@techsolutions.com',
  '+91-9876543211',
  1,
  1,
  'CONTACTED',
  3,
  'Website',
  'Bangalore',
  'Corporate event planning for annual conference.',
  NULL,
  NULL,
  'high',
  80000.00,
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '1 day',
  'contacted',
  70,
  ARRAY['corporate', 'conference', 'website'],
  '50k-100k',
  NULL,
  'Convention Center, Bangalore',
  500,
  'Annual tech conference for 500 attendees. Need full event management including catering, AV, and decor.',
  NOW() - INTERVAL '5 days'
),

-- Overdue follow-up lead
(
  'LD2024003',
  'Anita Reddy',
  'anita.reddy@yahoo.com',
  '+91-9876543212',
  1,
  1,
  'CONTACTED',
  3,
  'Referral',
  'Hyderabad',
  'Engagement party planning. Friend referral.',
  'Anita Reddy',
  'Kiran Kumar',
  'medium',
  45000.00,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '2 days', -- Overdue
  'interested',
  55,
  ARRAY['engagement', 'referral', 'party'],
  '30k-50k',
  '2024-11-20',
  'Hotel Grand Palace, Hyderabad',
  150,
  'Engagement ceremony for 150 guests. Traditional setup required with full catering.',
  NOW() - INTERVAL '12 days'
),

-- High value corporate client
(
  'LD2024004',
  'Global Corp International',
  'events@globalcorp.com',
  '+91-9876543213',
  1,
  1,
  'QUALIFIED',
  3,
  'LinkedIn',
  'Delhi',
  'Multi-city corporate events. Quarterly meetings.',
  NULL,
  NULL,
  'high',
  200000.00,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '3 days',
  'quotation_sent',
  95,
  ARRAY['corporate', 'multi-city', 'quarterly'],
  '150k-250k',
  NULL,
  'Multiple venues across India',
  200,
  'Quarterly corporate events across 5 cities. Premium corporate client with recurring business potential.',
  NOW() - INTERVAL '8 days'
),

-- Low priority local event
(
  'LD2024005',
  'Sunita Menon',
  'sunita.menon@gmail.com',
  '+91-9876543214',
  1,
  1,
  'NEW',
  3,
  'Facebook',
  'Chennai',
  'Birthday party for daughter. Small budget.',
  NULL,
  NULL,
  'low',
  15000.00,
  NULL,
  NOW() + INTERVAL '5 days',
  'new',
  35,
  ARRAY['birthday', 'family', 'budget'],
  '10k-20k',
  NULL,
  'Community Hall, Chennai',
  80,
  'Sweet 16 birthday party. Simple decorations and catering for 80 people.',
  NOW() - INTERVAL '3 days'
);

-- Update lead scores based on the new data
UPDATE leads SET lead_score = 
  CASE 
    WHEN expected_value > 100000 AND priority IN ('urgent', 'high') THEN 90
    WHEN expected_value > 50000 AND status = 'QUALIFIED' THEN 80
    WHEN status = 'CONTACTED' AND priority = 'high' THEN 70
    WHEN status = 'CONTACTED' THEN 60
    WHEN status = 'NEW' AND priority = 'urgent' THEN 75
    WHEN status = 'NEW' AND priority = 'high' THEN 65
    WHEN status = 'NEW' THEN 50
    ELSE 40
  END
WHERE assigned_to = 3;

-- Log the sample data insertion
SELECT 'Sample lead data inserted successfully!' as message; 