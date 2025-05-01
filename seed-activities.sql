-- Insert some sample activities if the table is empty
INSERT INTO activities (action_type, entity_type, entity_id, entity_name, description, user_name, created_at)
SELECT 
  action_type, entity_type, entity_id::UUID, entity_name, description, user_name, created_at
FROM (
  VALUES
    ('create', 'company', '11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'Acme Corporation was added to the system', 'System Admin', NOW() - INTERVAL '2 hours'),
    ('update', 'employee', '22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'Sarah Johnson''s information was updated', 'Admin User', NOW() - INTERVAL '3 hours'),
    ('create', 'branch', '33333333-3333-3333-3333-333333333333', 'New York Branch', 'New York branch was created for TechCorp', 'Jane Smith', NOW() - INTERVAL '5 hours'),
    ('status_change', 'client', '44444444-4444-4444-4444-444444444444', 'Global Industries', 'Global Industries status changed to Active', 'Admin User', NOW() - INTERVAL '1 day'),
    ('create', 'vendor', '55555555-5555-5555-5555-555555555555', 'Office Supplies Inc.', 'Office Supplies Inc. was added as a vendor', 'John Doe', NOW() - INTERVAL '1 day'),
    ('assignment', 'employee', '66666666-6666-6666-6666-666666666666', 'Mark Wilson', 'Mark Wilson was assigned to Marketing department', 'Jane Smith', NOW() - INTERVAL '2 days')
) AS sample_data(action_type, entity_type, entity_id, entity_name, description, user_name, created_at)
WHERE NOT EXISTS (SELECT 1 FROM activities LIMIT 1);
