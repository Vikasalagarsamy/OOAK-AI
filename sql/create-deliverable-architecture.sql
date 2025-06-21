-- New Deliverable Architecture
-- Separating catalog management from workflow management

-- =====================================================
-- 1. DELIVERABLE CATALOG TABLE (Simple Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS deliverable_catalog (
    id SERIAL PRIMARY KEY,
    deliverable_name VARCHAR(255) NOT NULL,
    deliverable_category VARCHAR(50) NOT NULL CHECK (deliverable_category IN ('Main', 'Optional')),
    deliverable_type VARCHAR(50) NOT NULL CHECK (deliverable_type IN ('Photo', 'Video')),
    description TEXT,
    
    -- Package Pricing
    basic_price DECIMAL(10,2) DEFAULT 0.00,
    premium_price DECIMAL(10,2) DEFAULT 0.00,
    elite_price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Package Inclusion
    package_included JSONB DEFAULT '{"basic": false, "premium": false, "elite": false}'::jsonb,
    
    -- Metadata
    status INTEGER DEFAULT 1 CHECK (status IN (0, 1)),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Indexes
    UNIQUE(deliverable_name, deliverable_category, deliverable_type)
);

-- =====================================================
-- 2. DELIVERABLE WORKFLOWS TABLE (Process Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS deliverable_workflows (
    id SERIAL PRIMARY KEY,
    deliverable_catalog_id INTEGER NOT NULL REFERENCES deliverable_catalog(id) ON DELETE CASCADE,
    
    -- Process Details
    process_name VARCHAR(255) NOT NULL,
    process_description TEXT,
    sort_order INTEGER DEFAULT 1,
    
    -- Stakeholder Involvement
    has_customer BOOLEAN DEFAULT FALSE,
    has_employee BOOLEAN DEFAULT FALSE,
    has_qc BOOLEAN DEFAULT FALSE,
    has_vendor BOOLEAN DEFAULT FALSE,
    
    -- Timing Configuration
    timing_type VARCHAR(20) DEFAULT 'days' CHECK (timing_type IN ('days', 'hr', 'min')),
    tat INTEGER DEFAULT 0,
    tat_value INTEGER DEFAULT 0,
    buffer INTEGER DEFAULT 0,
    
    -- Process Options
    skippable BOOLEAN DEFAULT FALSE,
    has_download_option BOOLEAN DEFAULT FALSE,
    has_task_process BOOLEAN DEFAULT TRUE,
    has_upload_folder_path BOOLEAN DEFAULT FALSE,
    process_starts_from INTEGER DEFAULT 1,
    
    -- Workflow Templates
    on_start_template TEXT,
    on_complete_template TEXT,
    on_correction_template TEXT,
    
    -- Additional Configuration
    employee JSONB DEFAULT '[]'::jsonb, -- Array of employee IDs
    input_names JSONB DEFAULT '[]'::jsonb, -- Array of input field names
    link VARCHAR(500),
    stream VARCHAR(10) CHECK (stream IN ('UP', 'DOWN')),
    stage VARCHAR(100),
    
    -- Process Pricing (optional override of catalog pricing)
    process_basic_price DECIMAL(10,2),
    process_premium_price DECIMAL(10,2),
    process_elite_price DECIMAL(10,2),
    
    -- Metadata
    status INTEGER DEFAULT 1 CHECK (status IN (0, 1)),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_deliverable_catalog_category_type 
    ON deliverable_catalog(deliverable_category, deliverable_type);

CREATE INDEX IF NOT EXISTS idx_deliverable_catalog_status 
    ON deliverable_catalog(status);

CREATE INDEX IF NOT EXISTS idx_deliverable_workflows_catalog_id 
    ON deliverable_workflows(deliverable_catalog_id);

CREATE INDEX IF NOT EXISTS idx_deliverable_workflows_sort_order 
    ON deliverable_workflows(deliverable_catalog_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_deliverable_workflows_status 
    ON deliverable_workflows(status);

-- =====================================================
-- 4. UPDATE TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deliverable_catalog_updated_date BEFORE UPDATE
    ON deliverable_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER update_deliverable_workflows_updated_date BEFORE UPDATE
    ON deliverable_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

-- =====================================================
-- 5. VIEWS FOR EASY QUERYING
-- =====================================================

-- Complete deliverable view with workflow count
CREATE OR REPLACE VIEW deliverable_catalog_summary AS
SELECT 
    dc.*,
    COUNT(dw.id) as workflow_count,
    COALESCE(SUM(CASE WHEN dw.process_basic_price IS NOT NULL THEN dw.process_basic_price ELSE dc.basic_price END), dc.basic_price) as total_basic_price,
    COALESCE(SUM(CASE WHEN dw.process_premium_price IS NOT NULL THEN dw.process_premium_price ELSE dc.premium_price END), dc.premium_price) as total_premium_price,
    COALESCE(SUM(CASE WHEN dw.process_elite_price IS NOT NULL THEN dw.process_elite_price ELSE dc.elite_price END), dc.elite_price) as total_elite_price
FROM deliverable_catalog dc
LEFT JOIN deliverable_workflows dw ON dc.id = dw.deliverable_catalog_id AND dw.status = 1
WHERE dc.status = 1
GROUP BY dc.id;

-- Complete workflow view with catalog details
CREATE OR REPLACE VIEW deliverable_workflow_details AS
SELECT 
    dw.*,
    dc.deliverable_name,
    dc.deliverable_category,
    dc.deliverable_type,
    dc.basic_price as catalog_basic_price,
    dc.premium_price as catalog_premium_price,
    dc.elite_price as catalog_elite_price,
    dc.package_included as catalog_package_included
FROM deliverable_workflows dw
JOIN deliverable_catalog dc ON dw.deliverable_catalog_id = dc.id
WHERE dw.status = 1 AND dc.status = 1
ORDER BY dc.deliverable_name, dw.sort_order; 