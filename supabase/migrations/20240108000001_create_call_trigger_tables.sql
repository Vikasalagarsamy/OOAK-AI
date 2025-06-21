-- Create employee_devices table to store device information
CREATE TABLE IF NOT EXISTS employee_devices (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL REFERENCES employees(employee_id),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    fcm_token TEXT,
    device_name VARCHAR(255),
    platform VARCHAR(50) DEFAULT 'android',
    app_version VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_triggers table to log call trigger requests
CREATE TABLE IF NOT EXISTS call_triggers (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL REFERENCES employees(employee_id),
    phone_number VARCHAR(20) NOT NULL,
    client_name VARCHAR(255),
    task_id INTEGER,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, executed, failed, expired
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_devices_employee_id ON employee_devices(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_devices_active ON employee_devices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_call_triggers_employee_id ON call_triggers(employee_id);
CREATE INDEX IF NOT EXISTS idx_call_triggers_status ON call_triggers(status);
CREATE INDEX IF NOT EXISTS idx_call_triggers_triggered_at ON call_triggers(triggered_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_employee_devices_updated_at BEFORE UPDATE ON employee_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_triggers_updated_at BEFORE UPDATE ON call_triggers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample device data for testing
INSERT INTO employee_devices (employee_id, device_id, fcm_token, device_name, platform, app_version) 
VALUES 
('EMP001', 'android_device_001', 'sample_fcm_token_001', 'Admin Phone', 'android', '1.0.0'),
('EMP002', 'android_device_002', 'sample_fcm_token_002', 'Pradeep Phone', 'android', '1.0.0'),
('EMP003', 'android_device_003', 'sample_fcm_token_003', 'Manager Phone', 'android', '1.0.0')
ON CONFLICT (device_id) DO NOTHING; 