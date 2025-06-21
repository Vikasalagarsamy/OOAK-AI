-- Create dedicated junction tables for quotation services and deliverables
-- This provides proper normalization and easier querying for future modules

-- 1. QUOTATION_SERVICES Junction Table
CREATE TABLE IF NOT EXISTS quotation_services (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES quotation_events(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    package_type VARCHAR(20) DEFAULT 'basic' CHECK (package_type IN ('basic', 'premium', 'elite', 'custom')),
    unit_price DECIMAL(10,2), -- Override price if different from master
    total_price DECIMAL(10,2), -- Calculated: unit_price * quantity
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. QUOTATION_DELIVERABLES Junction Table  
CREATE TABLE IF NOT EXISTS quotation_deliverables (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES quotation_events(id) ON DELETE CASCADE,
    deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    package_type VARCHAR(20) DEFAULT 'basic' CHECK (package_type IN ('basic', 'premium', 'elite', 'custom')),
    unit_price DECIMAL(10,2), -- Override price if different from master
    total_price DECIMAL(10,2), -- Calculated: unit_price * quantity
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered')),
    due_date DATE, -- For post-production workflow
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_quotation_services_quotation_id ON quotation_services(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_services_service_id ON quotation_services(service_id);
CREATE INDEX IF NOT EXISTS idx_quotation_services_event_id ON quotation_services(event_id);
CREATE INDEX IF NOT EXISTS idx_quotation_services_status ON quotation_services(status);

CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_quotation_id ON quotation_deliverables(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_deliverable_id ON quotation_deliverables(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_event_id ON quotation_deliverables(event_id);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_status ON quotation_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_due_date ON quotation_deliverables(due_date);

-- 4. Create Unique Constraints to Prevent Duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_quotation_service 
ON quotation_services(quotation_id, event_id, service_id) 
WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_quotation_deliverable 
ON quotation_deliverables(quotation_id, event_id, deliverable_id) 
WHERE status != 'cancelled';

-- 5. Add Updated Timestamp Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotation_services_updated_at 
    BEFORE UPDATE ON quotation_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotation_deliverables_updated_at 
    BEFORE UPDATE ON quotation_deliverables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Add Comments for Documentation
COMMENT ON TABLE quotation_services IS 'Junction table linking quotations to services with quantities and pricing';
COMMENT ON TABLE quotation_deliverables IS 'Junction table linking quotations to deliverables with workflow status';

COMMENT ON COLUMN quotation_services.package_type IS 'Package type for pricing calculation';
COMMENT ON COLUMN quotation_services.unit_price IS 'Override price, if null uses service master price';
COMMENT ON COLUMN quotation_services.status IS 'Service status for workflow tracking';

COMMENT ON COLUMN quotation_deliverables.package_type IS 'Package type for pricing calculation';
COMMENT ON COLUMN quotation_deliverables.unit_price IS 'Override price, if null uses deliverable master price';
COMMENT ON COLUMN quotation_deliverables.status IS 'Deliverable workflow status';
COMMENT ON COLUMN quotation_deliverables.due_date IS 'Expected delivery date for post-production workflow';

-- Success message
SELECT 'SUCCESS: Quotation junction tables created successfully!' as result; 