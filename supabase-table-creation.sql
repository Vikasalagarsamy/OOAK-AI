-- STEP 1: Create quotation_services table
CREATE TABLE quotation_services (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES quotation_events(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    package_type VARCHAR(20) DEFAULT 'basic',
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Create quotation_deliverables table
CREATE TABLE quotation_deliverables (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES quotation_events(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    package_type VARCHAR(20) DEFAULT 'basic',
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'quoted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: Create indexes
CREATE INDEX idx_quotation_services_quotation_id ON quotation_services(quotation_id);
CREATE INDEX idx_quotation_services_service_id ON quotation_services(service_id);
CREATE INDEX idx_quotation_services_event_id ON quotation_services(event_id);
CREATE INDEX idx_quotation_services_status ON quotation_services(status);

CREATE INDEX idx_quotation_deliverables_quotation_id ON quotation_deliverables(quotation_id);
CREATE INDEX idx_quotation_deliverables_service_id ON quotation_deliverables(service_id);
CREATE INDEX idx_quotation_deliverables_deliverable_id ON quotation_deliverables(deliverable_id);
CREATE INDEX idx_quotation_deliverables_event_id ON quotation_deliverables(event_id);
CREATE INDEX idx_quotation_deliverables_status ON quotation_deliverables(status);

-- STEP 4: Add constraints
ALTER TABLE quotation_services ADD CONSTRAINT chk_package_type 
CHECK (package_type IN ('basic', 'premium', 'elite', 'custom'));

ALTER TABLE quotation_services ADD CONSTRAINT chk_status 
CHECK (status IN ('active', 'cancelled', 'completed'));

ALTER TABLE quotation_deliverables ADD CONSTRAINT chk_deliverable_package_type 
CHECK (package_type IN ('basic', 'premium', 'elite', 'custom'));

ALTER TABLE quotation_deliverables ADD CONSTRAINT chk_deliverable_status 
CHECK (status IN ('quoted', 'confirmed', 'cancelled'));

-- STEP 5: Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotation_services_updated_at 
    BEFORE UPDATE ON quotation_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotation_deliverables_updated_at 
    BEFORE UPDATE ON quotation_deliverables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 