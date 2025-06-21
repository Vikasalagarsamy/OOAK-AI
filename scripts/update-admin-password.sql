-- Update admin user's password hash
UPDATE employees
SET password_hash = 'admin123'
WHERE username = 'admin'; 