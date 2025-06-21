#!/usr/bin/env node

const { execSync } = require('child_process');

// Database configurations
const REMOTE_CONFIG = {
  url: 'https://aavofqdzjhyfjygkxynq.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdm9mcWR6amh5Zmp5Z2t4eW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODkxNCwiZXhwIjoyMDYwNjc0OTE0fQ.EDdXANDTnC8zjWciG_p6JORec0KyMVZQe2c0Ca6HfLY'
};

const LOCAL_CONFIG = {
  url: 'http://localhost:8000',
  dbUrl: 'postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
};

// Table creation SQL - based on your previous schema
const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  title TEXT,
  department_id BIGINT,
  responsibilities TEXT,
  required_skills TEXT,
  is_management BOOLEAN DEFAULT false,
  is_system_role BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  hire_date DATE,
  role_id BIGINT,
  department_id BIGINT,
  manager_id BIGINT,
  salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  industry TEXT,
  size_category TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  website TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  manager_id BIGINT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  head_id BIGINT,
  parent_id BIGINT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create designations table
CREATE TABLE IF NOT EXISTS designations (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  department_id BIGINT,
  level INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deliverable_master table
CREATE TABLE IF NOT EXISTS deliverable_master (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  estimated_hours INTEGER,
  complexity_level TEXT,
  required_skills TEXT[],
  deliverable_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  priority TEXT DEFAULT 'medium',
  recipient_id BIGINT,
  sender_id BIGINT,
  read_at TIMESTAMPTZ,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_accounts table
CREATE TABLE IF NOT EXISTS user_accounts (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  role_id BIGINT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales_team_members table
CREATE TABLE IF NOT EXISTS sales_team_members (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT,
  team_name TEXT,
  role TEXT,
  territory TEXT,
  target_amount DECIMAL(15,2),
  commission_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales_performance_metrics table
CREATE TABLE IF NOT EXISTS sales_performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  team_member_id BIGINT,
  period_start DATE,
  period_end DATE,
  calls_made INTEGER DEFAULT 0,
  meetings_scheduled INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  revenue_generated DECIMAL(15,2) DEFAULT 0,
  target_achievement_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (optional, disable for easier access)
-- ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- etc.

-- Or create permissive policies for development
DO $$ 
BEGIN
  -- Create allow-all policies for development
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_roles') THEN
    EXECUTE 'CREATE POLICY allow_all_roles ON roles FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_employees') THEN
    EXECUTE 'CREATE POLICY allow_all_employees ON employees FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_companies') THEN
    EXECUTE 'CREATE POLICY allow_all_companies ON companies FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_clients') THEN
    EXECUTE 'CREATE POLICY allow_all_clients ON clients FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  
  -- Add more policies as needed
END $$;

COMMIT;
`;

async function createTables() {
  console.log('🏗️  Creating tables in local database...');
  
  try {
    // Write SQL to file
    require('fs').writeFileSync('create_tables.sql', createTablesSQL);
    
    // Execute SQL using psql
    const dbContainer = 'supabase-db';
    const cmd = `docker exec ${dbContainer} psql -U postgres -d postgres -f -`;
    
    execSync(`echo "${createTablesSQL.replace(/"/g, '\\"')}" | docker exec -i ${dbContainer} psql -U postgres -d postgres`, 
      { stdio: 'inherit' });
    
    console.log('✅ Tables created successfully!');
  } catch (error) {
    console.log(`❌ Error creating tables: ${error.message}`);
    console.log('Trying alternative approach...');
    
    // Alternative: try connecting directly
    try {
      execSync(`export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH" && psql "${LOCAL_CONFIG.dbUrl}" -f create_tables.sql`, 
        { stdio: 'inherit' });
      console.log('✅ Tables created via direct connection!');
    } catch (error2) {
      console.log(`❌ Alternative approach failed: ${error2.message}`);
    }
  }
}

async function fetchFromRemote(endpoint) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(`${REMOTE_CONFIG.url}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': REMOTE_CONFIG.serviceKey,
      'Authorization': `Bearer ${REMOTE_CONFIG.serviceKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

async function insertIntoLocal(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`ℹ️  No data to insert for ${tableName}`);
    return;
  }

  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(`${LOCAL_CONFIG.url}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'apikey': LOCAL_CONFIG.serviceKey,
        'Authorization': `Bearer ${LOCAL_CONFIG.serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`✅ Successfully inserted ${data.length} records into ${tableName}`);
  } catch (error) {
    console.log(`❌ Failed to insert into ${tableName}: ${error.message}`);
  }
}

async function migrateTable(tableName) {
  console.log(`\n🔄 Migrating table: ${tableName}`);
  
  try {
    const data = await fetchFromRemote(tableName);
    console.log(`📥 Fetched ${data.length} records from remote ${tableName}`);
    
    if (data.length > 0) {
      await insertIntoLocal(tableName, data);
    }
    
  } catch (error) {
    console.log(`❌ Error migrating ${tableName}: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Creating Tables and Migrating Data');
  console.log('=====================================');
  
  // Step 1: Create tables
  await createTables();
  
  console.log('\n🔄 Starting data migration...\n');
  
  // Step 2: Migrate data
  const tables = [
    'roles',
    'employees', 
    'companies',
    'clients',
    'vendors',
    'branches',
    'departments',
    'designations',
    'deliverable_master',
    'notifications',
    'user_accounts',
    'sales_team_members',
    'sales_performance_metrics'
  ];

  for (const table of tables) {
    await migrateTable(table);
  }

  console.log('\n🎉 Migration completed!');
  console.log('\n📍 Next steps:');
  console.log('1. Open Supabase Studio: http://localhost:8000');
  console.log('2. Login with: supabase / this_password_is_insecure_and_should_be_updated');
  console.log('3. Check your tables and data in the Table Editor');
}

if (require.main === module) {
  main().catch(console.error);
} 