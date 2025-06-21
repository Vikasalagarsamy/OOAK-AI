-- =============================================
-- SUPABASE REMOTE SCHEMA SYNC
-- Generated from: supabase gen types typescript --linked
-- =============================================

-- Drop existing tables if they exist (for clean slate)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE BUSINESS TABLES
-- =============================================

-- Companies
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    tax_id TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designations
CREATE TABLE designations (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER MANAGEMENT
-- =============================================

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Accounts
CREATE TABLE IF NOT EXISTS user_accounts (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    is_admin BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    job_title TEXT,
    department_id INTEGER REFERENCES departments(id),
    designation_id INTEGER REFERENCES designations(id),
    branch_id INTEGER REFERENCES branches(id),
    company_id INTEGER REFERENCES companies(id),
    hire_date DATE,
    salary DECIMAL(10,2),
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEAD MANAGEMENT
-- =============================================

-- Lead Sources
CREATE TABLE IF NOT EXISTS lead_sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    lead_number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    source_id INTEGER REFERENCES lead_sources(id),
    assigned_to INTEGER REFERENCES employees(id),
    status TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'medium',
    value DECIMAL(12,2),
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    branch_id INTEGER REFERENCES branches(id),
    company_id INTEGER REFERENCES companies(id)
);

-- Lead Activities  
CREATE TABLE lead_activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    user_id INTEGER REFERENCES user_accounts(id),
    activity_type TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QUOTATION MANAGEMENT
-- =============================================

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    quotation_number TEXT UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES leads(id),
    client_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    total_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'draft',
    valid_until DATE,
    notes TEXT,
    created_by INTEGER REFERENCES user_accounts(id),
    approved_by INTEGER REFERENCES user_accounts(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    terms_and_conditions TEXT,
    payment_terms TEXT
);

-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES user_accounts(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    priority TEXT DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_label TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    quotation_id INTEGER REFERENCES quotations(id)
);

-- =============================================
-- WHATSAPP INTEGRATION
-- =============================================

-- WhatsApp Config
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_token TEXT NOT NULL,
    business_phone_number_id TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    webhook_verify_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    template_content TEXT NOT NULL,
    template_type TEXT NOT NULL,
    language_code TEXT DEFAULT 'en',
    status TEXT DEFAULT 'active',
    variables JSONB DEFAULT '{}',
    ai_optimized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES user_accounts(id),
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_id TEXT,
    template_id UUID REFERENCES whatsapp_templates(id),
    notification_id UUID REFERENCES notifications(id),
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    ai_personalization_score DECIMAL(3,2),
    ai_timing_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VENDOR & CLIENT MANAGEMENT
-- =============================================

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    vendor_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    website TEXT,
    tax_id TEXT,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TASK & PROJECT MANAGEMENT
-- =============================================

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES employees(id),
    created_by INTEGER REFERENCES user_accounts(id),
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SYSTEM TABLES
-- =============================================

-- Menu Items
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES menu_items(id),
    name TEXT NOT NULL,
    path TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Permissions
CREATE TABLE menu_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    can_view BOOLEAN DEFAULT FALSE,
    can_add BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, menu_item_id)
);

-- System Logs
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_accounts(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bug Reports
CREATE TABLE bugs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    reported_by INTEGER REFERENCES user_accounts(id),
    assigned_to INTEGER REFERENCES employees(id),
    steps_to_reproduce TEXT,
    environment_info TEXT,
    expected_behavior TEXT,
    actual_behavior TEXT,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- =============================================
-- AUDIT & TRACKING
-- =============================================

-- Activity Logs
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_accounts(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Metrics
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI & ANALYTICS
-- =============================================

-- AI Insights
CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    insight_type TEXT,
    probability DECIMAL(5,4),
    recommended_action TEXT,
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Core business indexes
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Lead management indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- WhatsApp indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- System indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- =============================================
-- VIEWS (Recreating key views from schema)
-- =============================================

-- User Menu Permissions View
CREATE VIEW user_menu_permissions AS
SELECT 
    ua.id as user_id,
    ua.username,
    r.id as role_id,
    r.title as role_title,
    mi.id as menu_item_id,
    mi.name as menu_name,
    mi.path as menu_path,
    mi.parent_id,
    mi.icon,
    mi.is_visible,
    COALESCE(mp.can_view, false) as can_view,
    COALESCE(mp.can_add, false) as can_add,
    COALESCE(mp.can_edit, false) as can_edit,
    COALESCE(mp.can_delete, false) as can_delete
FROM user_accounts ua
JOIN roles r ON ua.role_id = r.id
CROSS JOIN menu_items mi
LEFT JOIN menu_permissions mp ON r.id = mp.role_id AND mi.id = mp.menu_item_id
WHERE ua.status = 'active' AND r.status = 'active';

-- Recent Business Notifications View
CREATE VIEW recent_business_notifications AS
SELECT 
    n.*,
    EXTRACT(EPOCH FROM (NOW() - n.created_at))/60 as minutes_ago
FROM notifications n
WHERE n.created_at > NOW() - INTERVAL '30 days'
ORDER BY n.created_at DESC;

-- User Notification Summary View
CREATE VIEW user_notification_summary AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE NOT is_read) as unread_count,
    COUNT(*) FILTER (WHERE NOT is_read AND priority = 'high') as high_unread,
    COUNT(*) FILTER (WHERE NOT is_read AND priority = 'urgent') as urgent_unread,
    MAX(created_at) as latest_notification
FROM notifications
GROUP BY user_id;

-- =============================================
-- BASIC FUNCTIONS (Key ones from schema)
-- =============================================

-- Current User ID Function
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('myapp.current_user_id', true), '')::INTEGER,
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate Event ID Function
CREATE OR REPLACE FUNCTION generate_event_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'evt_' || encode(gen_random_bytes(8), 'hex');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER branches_updated_at BEFORE UPDATE ON branches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER departments_updated_at BEFORE UPDATE ON departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER designations_updated_at BEFORE UPDATE ON designations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER roles_updated_at BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_accounts_updated_at BEFORE UPDATE ON user_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER quotations_updated_at BEFORE UPDATE ON quotations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON vendors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bugs_updated_at BEFORE UPDATE ON bugs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER whatsapp_config_updated_at BEFORE UPDATE ON whatsapp_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- BASIC SEED DATA
-- =============================================

-- Insert default roles
INSERT INTO roles (title, description) VALUES 
('Super Admin', 'Full system access'),
('Admin', 'Administrative access'),
('Manager', 'Management level access'), 
('Employee', 'Basic employee access'),
('Sales', 'Sales team access'),
('HR', 'Human resources access')
ON CONFLICT DO NOTHING;

-- Insert default lead sources
INSERT INTO lead_sources (name, description) VALUES 
('Website', 'Leads from company website'),
('Social Media', 'Leads from social platforms'),
('Referral', 'Referral leads'),
('Cold Call', 'Cold calling leads'),
('Email Campaign', 'Email marketing leads'),
('Walk-in', 'Walk-in customers')
ON CONFLICT DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUPABASE SCHEMA MIGRATION COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: 20+ core business tables';
    RAISE NOTICE 'Views created: Key business views';
    RAISE NOTICE 'Functions created: Core utility functions';
    RAISE NOTICE 'Triggers created: Updated_at automation';
    RAISE NOTICE 'Indexes created: Performance optimization';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review the schema in Supabase Studio';
    RAISE NOTICE '2. Run data sync script to import data';
    RAISE NOTICE '3. Test connections and permissions';
    RAISE NOTICE '========================================';
END $$;