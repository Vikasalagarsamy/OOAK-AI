-- Create services table for event services management
-- This table will store all available services for events

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  servicename VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2),
  unit VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_servicename ON services(servicename);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

-- Add constraints
ALTER TABLE services 
  ADD CONSTRAINT check_services_status 
  CHECK (status IN ('Active', 'Inactive', 'Discontinued'));

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data from the previous CRM system
INSERT INTO services (servicename, status, category, created_at) VALUES
('CANDID PHOTOGRAPHY', 'Active', 'Photography', '2021-01-04 15:18:51'),
('CONVENTIONAL PHOTOGRAPHY', 'Active', 'Photography', '2021-01-04 15:18:59'),
('CANDID VIDEOGRAPHY', 'Active', 'Videography', '2021-01-04 15:19:07'),
('CONVENTIONAL VIDEOGRAPHY', 'Active', 'Videography', '2021-01-04 15:19:14'),
('HELICAM / DRONE', 'Active', 'Technology', '2021-01-04 15:19:27'),
('LIVE STREAMING', 'Active', 'Technology', '2021-01-04 15:19:36'),
('LED TV - 49 INCH', 'Active', 'Equipment', '2021-01-04 15:19:42'),
('LED WALL - 8 FT X 6 FT', 'Active', 'Lighting', '2021-01-04 15:20:32'),
('LED WALL - 12 FT X 8 FT', 'Active', 'Lighting', '2021-01-04 15:20:49'),
('LED TV - 55 INCH', 'Active', 'Equipment', '2021-01-04 15:20:59'),
('MIXING UNIT', 'Active', 'Equipment', '2021-01-04 15:21:08'),
('CRANE', 'Active', 'Equipment', '2021-01-04 15:21:12'),
('360 DEGREE VR', 'Active', 'Technology', '2021-01-04 15:21:28'),
('PHOTO BOOTH', 'Active', 'Equipment', '2021-01-04 15:21:34'),
('IN-HOUSE SUPERVISOR', 'Active', 'Staffing', '2021-07-01 14:05:44'),
('DATA MANAGER', 'Active', 'Staffing', '2021-07-01 14:05:57'),
('PHOTOGRAPHY ASSISTANT', 'Active', 'Staffing', '2021-07-01 14:08:59'),
('CINEMATOGRAPHY ASSISTANT', 'Active', 'Staffing', '2021-07-01 14:09:09'),
('FREELANCER SUPERVISOR', 'Active', 'Staffing', '2021-01-04 15:18:51'),
('EQUIPMENT RENTAL', 'Active', 'Other', '2022-07-13 14:36:47'),
('360 DEGREE SPIN VIDEO', 'Active', 'Technology', '2023-05-12 18:38:27')
ON CONFLICT (servicename) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE services IS 'Event services catalog for managing available services';
COMMENT ON COLUMN services.servicename IS 'Name of the service offered';
COMMENT ON COLUMN services.status IS 'Current status of the service (Active, Inactive, Discontinued)';
COMMENT ON COLUMN services.description IS 'Detailed description of the service';
COMMENT ON COLUMN services.category IS 'Service category (Photography, Videography, Equipment, etc.)';
COMMENT ON COLUMN services.price IS 'Base price for the service';
COMMENT ON COLUMN services.unit IS 'Unit of measurement for pricing (hour, day, event, etc.)';
COMMENT ON COLUMN services.created_at IS 'Timestamp when the service was created';
COMMENT ON COLUMN services.updated_at IS 'Timestamp when the service was last updated'; 