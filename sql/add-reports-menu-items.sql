-- First check if Reports parent menu already exists
DO $$
DECLARE
    reports_menu_id INT;
BEGIN
    -- Check if Reports menu already exists
    SELECT id INTO reports_menu_id FROM menu_items WHERE name = 'Reports' AND parent_id IS NULL;
    
    -- If Reports menu doesn't exist, create it
    IF reports_menu_id IS NULL THEN
        INSERT INTO menu_items (name, description, icon, path, sort_order, is_visible, parent_id)
        VALUES ('Reports', 'Analytics and reporting dashboards', 'bar-chart', '/reports', 4, true, NULL)
        RETURNING id INTO reports_menu_id;
        
        -- Log the creation
        RAISE NOTICE 'Created Reports main menu with ID %', reports_menu_id;
    ELSE
        RAISE NOTICE 'Reports main menu already exists with ID %', reports_menu_id;
    END IF;
    
    -- Add submenu items under Reports
    -- Lead Source Performance
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Lead Source Analysis' AND parent_id = reports_menu_id) THEN
        INSERT INTO menu_items (name, description, icon, path, sort_order, is_visible, parent_id)
        VALUES ('Lead Source Analysis', 'Analyze performance of different lead sources', 'pie-chart', '/reports/lead-sources', 1, true, reports_menu_id);
    END IF;
    
    -- Sales Funnel
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Conversion Funnel' AND parent_id = reports_menu_id) THEN
        INSERT INTO menu_items (name, description, icon, path, sort_order, is_visible, parent_id)
        VALUES ('Conversion Funnel', 'Track lead progression through sales stages', 'git-branch', '/reports/conversion-funnel', 2, true, reports_menu_id);
    END IF;
    
    -- Team Performance
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Team Performance' AND parent_id = reports_menu_id) THEN
        INSERT INTO menu_items (name, description, icon, path, sort_order, is_visible, parent_id)
        VALUES ('Team Performance', 'Compare sales team performance metrics', 'users', '/reports/team-performance', 3, true, reports_menu_id);
    END IF;
    
    -- Trend Analysis
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Trend Analysis' AND parent_id = reports_menu_id) THEN
        INSERT INTO menu_items (name, description, icon, path, sort_order, is_visible, parent_id)
        VALUES ('Trend Analysis', 'Analyze lead and conversion trends over time', 'trending-up', '/reports/trends', 4, true, reports_menu_id);
    END IF;
    
    -- Custom Reports
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Custom Reports' AND parent_id = reports_menu_id) THEN
        INSERT INTO menu_items (name, description, icon, path, sort_order, is_visible, parent_id)
        VALUES ('Custom Reports', 'Create and save custom report configurations', 'settings', '/reports/custom', 5, true, reports_menu_id);
    END IF;
END $$;
