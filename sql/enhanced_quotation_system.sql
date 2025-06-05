-- Enhanced Quotation System with Package-based Services and Deliverables
-- This schema supports dynamic, modular quotation generation with workflow tracking

-- 1. Enhanced Services Table with Package Pricing
ALTER TABLE services ADD COLUMN IF NOT EXISTS basic_price DECIMAL(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS premium_price DECIMAL(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS elite_price DECIMAL(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS package_included JSONB DEFAULT '{"basic": false, "premium": false, "elite": false}';

-- Update existing services with package pricing
UPDATE services SET 
    basic_price = 15000,
    premium_price = 25000,
    elite_price = 35000,
    package_included = '{"basic": true, "premium": true, "elite": true}'
WHERE servicename = 'CANDID PHOTOGRAPHY';

UPDATE services SET 
    basic_price = 12000,
    premium_price = 18000,
    elite_price = 25000,
    package_included = '{"basic": true, "premium": true, "elite": true}'
WHERE servicename = 'CONVENTIONAL PHOTOGRAPHY';

UPDATE services SET 
    basic_price = 18000,
    premium_price = 28000,
    elite_price = 40000,
    package_included = '{"basic": true, "premium": true, "elite": true}'
WHERE servicename = 'CANDID VIDEOGRAPHY';

UPDATE services SET 
    basic_price = 15000,
    premium_price = 22000,
    elite_price = 30000,
    package_included = '{"basic": true, "premium": true, "elite": true}'
WHERE servicename = 'CONVENTIONAL VIDEOGRAPHY';

-- 2. Deliverables System (based on CSV structure)
CREATE TABLE IF NOT EXISTS deliverables (
    id SERIAL PRIMARY KEY,
    deliverable_cat VARCHAR(50) NOT NULL, -- Main, Optional
    deliverable_type VARCHAR(50) NOT NULL, -- Photo, Video
    deliverable_id INTEGER,
    deliverable_name VARCHAR(255) NOT NULL,
    process_name VARCHAR(255) NOT NULL,
    
    -- Stakeholder involvement
    has_customer BOOLEAN DEFAULT false,
    has_employee BOOLEAN DEFAULT false,
    has_qc BOOLEAN DEFAULT false,
    has_vendor BOOLEAN DEFAULT false,
    
    -- Process configuration
    link VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    timing_type VARCHAR(20) DEFAULT 'days', -- days, hr, min
    
    -- Turnaround time configuration
    tat INTEGER, -- turnaround time value
    tat_value INTEGER, -- alternative tat field
    buffer INTEGER,
    skippable BOOLEAN DEFAULT false,
    employee JSONB, -- array of employee IDs
    
    -- Feature flags
    has_download_option BOOLEAN DEFAULT false,
    has_task_process BOOLEAN DEFAULT true,
    has_upload_folder_path BOOLEAN DEFAULT false,
    process_starts_from INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    
    -- Workflow templates
    on_start_template VARCHAR(255),
    on_complete_template VARCHAR(255),
    on_correction_template VARCHAR(255),
    input_names JSONB, -- array of input field names
    
    -- Metadata
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    
    -- Process flow
    stream VARCHAR(10), -- UP, DOWN
    stage VARCHAR(10), -- e.g., "0/6", "1/9"
    
    -- Package inclusion
    package_included JSONB DEFAULT '{"basic": false, "premium": false, "elite": false}',
    
    CONSTRAINT check_deliverable_cat CHECK (deliverable_cat IN ('Main', 'Optional')),
    CONSTRAINT check_deliverable_type CHECK (deliverable_type IN ('Photo', 'Video')),
    CONSTRAINT check_timing_type CHECK (timing_type IN ('days', 'hr', 'min')),
    CONSTRAINT check_stream CHECK (stream IN ('UP', 'DOWN') OR stream IS NULL)
);

-- Create indexes for deliverables
CREATE INDEX IF NOT EXISTS idx_deliverables_cat ON deliverables(deliverable_cat);
CREATE INDEX IF NOT EXISTS idx_deliverables_type ON deliverables(deliverable_type);
CREATE INDEX IF NOT EXISTS idx_deliverables_deliverable_id ON deliverables(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_sort_order ON deliverables(sort_order);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);

-- 3. Quote Snapshots - Lock prices at quote time
CREATE TABLE IF NOT EXISTS quote_services_snapshot (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    package_type VARCHAR(20) NOT NULL, -- basic, premium, elite
    locked_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_package_type CHECK (package_type IN ('basic', 'premium', 'elite'))
);

CREATE TABLE IF NOT EXISTS quote_deliverables_snapshot (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL,
    deliverable_id INTEGER NOT NULL,
    deliverable_name VARCHAR(255) NOT NULL,
    deliverable_type VARCHAR(50) NOT NULL,
    process_name VARCHAR(255) NOT NULL,
    package_type VARCHAR(20) NOT NULL,
    tat INTEGER,
    timing_type VARCHAR(20),
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_deliverable_package_type CHECK (package_type IN ('basic', 'premium', 'elite'))
);

-- 4. Package Definitions
CREATE TABLE IF NOT EXISTS service_packages (
    id SERIAL PRIMARY KEY,
    package_name VARCHAR(50) NOT NULL UNIQUE, -- basic, premium, elite
    package_display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_package_name CHECK (package_name IN ('basic', 'premium', 'elite'))
);

-- Insert default packages
INSERT INTO service_packages (package_name, package_display_name, description, sort_order) VALUES
('basic', 'Basic Package', 'Essential photography and videography services for your event', 1),
('premium', 'Premium Package', 'Enhanced coverage with additional features and better quality deliverables', 2),
('elite', 'Elite Package', 'Premium experience with comprehensive coverage and premium deliverables', 3)
ON CONFLICT (package_name) DO NOTHING;

-- 5. Future Extensions - Quote Components (for add-ons, discounts, etc.)
CREATE TABLE IF NOT EXISTS quote_components (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- service, deliverable, addon, discount, custom
    component_name VARCHAR(255) NOT NULL,
    component_description TEXT,
    unit_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    metadata JSONB, -- flexible field for component-specific data
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_component_type CHECK (component_type IN ('service', 'deliverable', 'addon', 'discount', 'custom'))
);

-- 6. Insert sample deliverables data based on CSV
INSERT INTO deliverables (
    deliverable_cat, deliverable_type, deliverable_id, deliverable_name, process_name,
    has_customer, has_employee, has_qc, has_vendor, link, sort_order, timing_type,
    tat, package_included
) VALUES
-- Main Photo Deliverables
('Main', 'Photo', 4, 'Conventional Album 250X40', 'SORTING AND CC', false, true, true, false, '', 0, 'min', 120, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Photo', 4, 'Conventional Album 250X40', 'CLIENT SELECTION', true, false, false, false, 'LINK', 1, 'days', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Photo', 4, 'Conventional Album 250X40', 'ALBUM DESIGNING', false, true, true, false, '', 3, 'hr', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Photo', 4, 'Conventional Album 250X40', 'CLIENT CONFIRMATION', true, false, false, false, 'LINK', 5, 'days', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Photo', 4, 'Conventional Album 250X40', 'REVISION', false, true, true, false, '', 6, 'hr', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Photo', 4, 'Conventional Album 250X40', 'PRINTER CONFIRMATION', true, false, false, false, '', 8, 'min', 0, '{"basic": true, "premium": true, "elite": true}'),

-- Main Video Deliverables  
('Main', 'Video', 11, 'Candid Video', 'CLIENT SONG SELECTION', true, false, false, false, 'Link', 0, 'days', 0, '{"basic": false, "premium": true, "elite": true}'),
('Main', 'Video', 11, 'Candid Video', 'EMPLOYEE SONG SELECTION', false, true, false, false, '', 1, 'hr', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Video', 11, 'Candid Video', 'CANDID VIDEO EDITING', false, true, false, false, '', 2, 'hr', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Video', 11, 'Candid Video', 'CLIENT CONFIRMATION', true, false, false, false, 'Link', 5, 'days', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Video', 10, 'Conventional Video', 'CLIENT SONG SELECTION', true, false, false, false, 'Link', 0, 'days', 0, '{"basic": false, "premium": true, "elite": true}'),
('Main', 'Video', 10, 'Conventional Video', 'EMPLOYEE SONG SELECTION', false, true, false, false, '', 1, 'hr', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Video', 10, 'Conventional Video', 'VIDEO EDITING', false, true, false, false, '', 2, 'hr', 0, '{"basic": true, "premium": true, "elite": true}'),
('Main', 'Video', 10, 'Conventional Video', 'CLIENT CONFIRMATION', true, false, false, false, 'Link', 5, 'days', 0, '{"basic": true, "premium": true, "elite": true}'),

-- Optional Photo Deliverables
('Optional', 'Photo', 12, 'OG Pictures', 'TIMESYNC AND CULLING', false, true, false, false, '', 0, 'hr', 0, '{"basic": false, "premium": true, "elite": true}'),
('Optional', 'Photo', 13, 'Edited Pictures', 'SORTING AND CC', false, true, true, false, '', 0, 'hr', 0, '{"basic": false, "premium": false, "elite": true}'),
('Optional', 'Photo', 13, 'Edited Pictures', 'CLIENT SELECTION', true, false, true, false, '', 0, 'hr', 0, '{"basic": false, "premium": false, "elite": true}'),
('Optional', 'Photo', 12, 'OG Pictures', 'LR CREATION', false, true, false, false, '', 0, 'min', 0, '{"basic": false, "premium": true, "elite": true}'),
('Optional', 'Photo', 12, 'OG Pictures', 'TIMESYNC', false, true, false, false, '', 1, 'min', 0, '{"basic": false, "premium": true, "elite": true}'),
('Optional', 'Photo', 12, 'OG Pictures', 'CULLING', false, true, false, false, '', 2, 'hr', 0, '{"basic": false, "premium": true, "elite": true}'),
('Optional', 'Photo', 12, 'OG Pictures', 'SAVE LR CATALOGUE', false, true, false, false, '', 4, 'min', 0, '{"basic": false, "premium": true, "elite": true}');

-- 7. Add comments for documentation
COMMENT ON TABLE deliverables IS 'Post-production deliverables workflow system';
COMMENT ON TABLE quote_services_snapshot IS 'Price-locked services for quotes';
COMMENT ON TABLE quote_deliverables_snapshot IS 'Deliverables snapshot for quotes';
COMMENT ON TABLE service_packages IS 'Package definitions (Basic, Premium, Elite)';
COMMENT ON TABLE quote_components IS 'Flexible quote components for future extensions';

-- 8. Create views for easier querying
CREATE OR REPLACE VIEW v_package_services AS
SELECT 
    p.package_name,
    p.package_display_name,
    s.id as service_id,
    s.servicename,
    s.category,
    CASE 
        WHEN p.package_name = 'basic' THEN s.basic_price
        WHEN p.package_name = 'premium' THEN s.premium_price
        WHEN p.package_name = 'elite' THEN s.elite_price
    END as package_price,
    s.package_included->>p.package_name = 'true' as is_included
FROM service_packages p
CROSS JOIN services s
WHERE s.status = 'Active'
ORDER BY p.sort_order, s.servicename;

CREATE OR REPLACE VIEW v_package_deliverables AS
SELECT 
    p.package_name,
    p.package_display_name,
    d.id as deliverable_id,
    d.deliverable_name,
    d.deliverable_type,
    d.process_name,
    d.tat,
    d.timing_type,
    d.sort_order,
    d.package_included->>p.package_name = 'true' as is_included
FROM service_packages p
CROSS JOIN deliverables d
WHERE d.status = 1
ORDER BY p.sort_order, d.deliverable_type, d.sort_order; 