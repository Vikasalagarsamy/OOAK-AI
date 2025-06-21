-- Create Accounting & Finance menu section
DO $$
DECLARE
    accounting_id INTEGER;
BEGIN
    -- Create main Accounting & Finance menu
    INSERT INTO menu_items (parent_id, name, description, icon, path, sort_order, is_visible)
    VALUES (NULL, 'Accounting & Finance', 'Financial management and accounting', 'dollar-sign', '/accounting', 25, true)
    RETURNING id INTO accounting_id;

    -- Create submenu items
    INSERT INTO menu_items (parent_id, name, description, icon, path, sort_order, is_visible)
    VALUES 
        (accounting_id, 'Financial Dashboard', 'Financial overview and KPIs', 'layout-dashboard', '/accounting/dashboard', 10, true),
        (accounting_id, 'Invoices', 'Manage invoices', 'file-text', '/accounting/invoices', 20, true),
        (accounting_id, 'Payments', 'Track payments', 'credit-card', '/accounting/payments', 30, true),
        (accounting_id, 'Expenses', 'Manage expenses', 'receipt', '/accounting/expenses', 40, true),
        (accounting_id, 'Financial Reports', 'View financial reports', 'bar-chart', '/accounting/reports', 50, true),
        (accounting_id, 'Bank Accounts', 'Manage bank accounts', 'landmark', '/accounting/bank-accounts', 60, true),
        (accounting_id, 'Tax Management', 'Handle tax calculations and filing', 'percent', '/accounting/tax', 70, true),
        (accounting_id, 'Payroll', 'Process employee payroll', 'wallet', '/accounting/payroll', 80, true);

    -- Create Financial Reports submenu items
    INSERT INTO menu_items (parent_id, name, description, icon, path, sort_order, is_visible)
    SELECT 
        id,
        'Balance Sheet',
        'View balance sheet',
        'file-bar-chart',
        '/accounting/reports/balance-sheet',
        10,
        true
    FROM menu_items WHERE path = '/accounting/reports'
    UNION ALL
    SELECT 
        id,
        'Profit & Loss',
        'View profit and loss statement',
        'trending-up',
        '/accounting/reports/profit-loss',
        20,
        true
    FROM menu_items WHERE path = '/accounting/reports'
    UNION ALL
    SELECT 
        id,
        'Cash Flow',
        'View cash flow statement',
        'refresh-cw',
        '/accounting/reports/cash-flow',
        30,
        true
    FROM menu_items WHERE path = '/accounting/reports'
    UNION ALL
    SELECT 
        id,
        'Tax Reports',
        'View tax reports',
        'file-text',
        '/accounting/reports/tax',
        40,
        true
    FROM menu_items WHERE path = '/accounting/reports';
END $$;

-- Configure Accountant role and permissions
DO $$
DECLARE
    accountant_role_id INTEGER;
BEGIN
    -- Create Accountant role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(title) = 'accountant') THEN
        INSERT INTO roles (title, description)
        VALUES ('Accountant', 'Manages financial accounts and transactions')
        RETURNING id INTO accountant_role_id;
    ELSE
        SELECT id INTO accountant_role_id FROM roles WHERE LOWER(title) = 'accountant';
    END IF;

    -- Clear existing permissions for the Accountant role
    DELETE FROM role_menu_permissions WHERE role_id = accountant_role_id;

    -- Grant permissions for accounting menus
    INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
    SELECT 
        accountant_role_id,
        id,
        TRUE, -- can_view
        TRUE, -- can_add
        TRUE, -- can_edit
        TRUE  -- can_delete (accountants need full control over financial records)
    FROM menu_items 
    WHERE path = '/' -- Dashboard
       OR path LIKE '/accounting%' -- All accounting menus
       OR path LIKE '/profile%' -- Profile settings
       OR path LIKE '/account%'; -- Account settings

    -- Explicitly deny access to non-accounting menus
    INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
    SELECT 
        accountant_role_id,
        id,
        FALSE, -- can_view
        FALSE, -- can_add
        FALSE, -- can_edit
        FALSE  -- can_delete
    FROM menu_items 
    WHERE path LIKE '/sales%'
       OR path LIKE '/organization%'
       OR path LIKE '/people%'
       OR path LIKE '/admin%'
       OR path LIKE '/events%'
    ON CONFLICT (role_id, menu_item_id) DO UPDATE
    SET can_view = FALSE, can_add = FALSE, can_edit = FALSE, can_delete = FALSE;
END $$; 