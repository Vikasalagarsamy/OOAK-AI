-- Update team member names to show proper display names instead of UUIDs
-- This will fix the display issue for existing team members

-- Update the current team member to show your username
UPDATE sales_team_members 
SET 
  full_name = 'vikas.alagarsamy1987',
  email = 'vikas.alagarsamy1987@company.com',
  updated_at = NOW()
WHERE employee_id = '00000000-0000-0000-0000-000000000000';

-- Verify the update
SELECT employee_id, full_name, email, role, territory 
FROM sales_team_members 
WHERE employee_id = '00000000-0000-0000-0000-000000000000';

-- Success message
SELECT 'Team member name updated successfully!' as status; 