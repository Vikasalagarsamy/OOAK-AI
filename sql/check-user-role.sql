-- Check if the user exists and get their current role
SELECT 
    ua.id as user_id, 
    ua.username, 
    ua.role_id,
    r.title as role_title
FROM 
    user_accounts ua
JOIN 
    roles r ON ua.role_id = r.id
WHERE 
    ua.username = 'vikas.alagarsamy1987';
