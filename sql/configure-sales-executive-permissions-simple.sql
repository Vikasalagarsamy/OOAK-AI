-- Configure Sales Executive (role_id = 2) permissions for role-based menu access
-- This script sets up basic permissions for sales executives like Deepika

-- Insert permissions for Sales Executive (role_id = 2)
INSERT INTO role_menu_permissions (role_id, menu_string_id, can_view, can_add, can_edit, can_delete, created_at, updated_at)
VALUES 
-- Core Business Section
(2, 'core-business', true, false, false, false, NOW(), NOW()),
(2, 'dashboard', true, false, false, false, NOW(), NOW()),

-- Sales Section (limited access)
(2, 'sales-revenue', true, false, false, false, NOW(), NOW()),
(2, 'sales-dashboard', true, false, false, false, NOW(), NOW()),
(2, 'sales-create-lead', true, true, false, false, NOW(), NOW()),
(2, 'sales-my-leads', true, true, true, false, NOW(), NOW()),
(2, 'sales-follow-up', true, true, true, false, NOW(), NOW()),
(2, 'sales-quotations', true, true, true, false, NOW(), NOW()),

-- People Section (view only)
(2, 'people-hr', true, false, false, false, NOW(), NOW()),
(2, 'people-dashboard', true, false, false, false, NOW(), NOW()),
(2, 'people-employees', true, false, false, false, NOW(), NOW()),

-- Reports Section (limited)
(2, 'reports-analytics', true, false, false, false, NOW(), NOW()),
(2, 'reports-lead-sources', true, false, false, false, NOW(), NOW()),
(2, 'reports-team-performance', true, false, false, false, NOW(), NOW());

-- Verify the permissions
SELECT 
    r.title as role_name,
    rmp.menu_string_id,
    rmp.can_view,
    rmp.can_add,
    rmp.can_edit,
    rmp.can_delete
FROM role_menu_permissions rmp
JOIN roles r ON rmp.role_id = r.id
WHERE rmp.role_id = 2
ORDER BY rmp.menu_string_id; 