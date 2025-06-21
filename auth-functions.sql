-- Create missing auth functions
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
BEGIN
    -- Simple implementation for development
    -- In real Supabase, this returns the current user's ID
    RETURN COALESCE(
        NULLIF(current_setting('request.jwt.claim.sub', true), ''),
        '00000000-0000-0000-0000-000000000000'
    )::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create missing storage schema
CREATE SCHEMA IF NOT EXISTS storage;

-- Grant permissions
GRANT USAGE ON SCHEMA storage TO authenticated, anon, service_role;

-- Create a simple implementation of storage functions (stubs for now)
CREATE OR REPLACE FUNCTION storage.filename(file_path TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN split_part(file_path, '/', -1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create role menu permissions table (referenced in other migrations)
CREATE TABLE IF NOT EXISTS role_menu_permissions (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) REFERENCES roles(name),
    menu_item VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_menu_permissions_role ON role_menu_permissions(role_name);

-- Grant permissions
GRANT ALL ON role_menu_permissions TO authenticated, service_role; 