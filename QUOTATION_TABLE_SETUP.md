# 🚀 Quotation Junction Tables Setup Guide

## Overview
This guide will help you create dedicated `quotation_services` and `quotation_deliverables` tables to replace the current JSON array approach. This provides better normalization, performance, and workflow tracking capabilities.

## 📋 Current vs New Architecture

### ❌ Current (JSON Arrays)
```json
// In quotation_events table
{
  "selected_services": [{"id": 1, "quantity": 1}, {"id": 3, "quantity": 1}],
  "selected_deliverables": [{"id": 2, "quantity": 1}, {"id": 3, "quantity": 1}]
}
```

### ✅ New (Dedicated Tables)
```sql
-- quotation_services table
quotation_id | service_id | quantity | package_type | unit_price | total_price | status
19          | 1          | 1        | basic        | 15000.00   | 15000.00    | active
19          | 3          | 1        | basic        | 5000.00    | 5000.00     | active

-- quotation_deliverables table  
quotation_id | deliverable_id | quantity | package_type | unit_price | total_price | status
19          | 2              | 1        | basic        | 0.00       | 0.00        | pending
19          | 3              | 1        | basic        | 0.00       | 0.00        | pending
```

## 🛠️ Setup Steps

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Create Tables
Copy and paste the content from `create-quotation-junction-tables.sql`:

```sql
-- 1. QUOTATION_SERVICES Junction Table
CREATE TABLE IF NOT EXISTS quotation_services (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES quotation_events(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    package_type VARCHAR(20) DEFAULT 'basic' CHECK (package_type IN ('basic', 'premium', 'elite', 'custom')),
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
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
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered')),
    due_date DATE,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Create Indexes and Constraints
Continue in the same SQL editor:

```sql
-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_quotation_services_quotation_id ON quotation_services(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_services_service_id ON quotation_services(service_id);
CREATE INDEX IF NOT EXISTS idx_quotation_services_event_id ON quotation_services(event_id);
CREATE INDEX IF NOT EXISTS idx_quotation_services_status ON quotation_services(status);

CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_quotation_id ON quotation_deliverables(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_deliverable_id ON quotation_deliverables(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_event_id ON quotation_deliverables(event_id);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_status ON quotation_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_due_date ON quotation_deliverables(due_date);

-- Create Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_quotation_service 
ON quotation_services(quotation_id, event_id, service_id) 
WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_quotation_deliverable 
ON quotation_deliverables(quotation_id, event_id, deliverable_id) 
WHERE status != 'cancelled';
```

### Step 4: Migrate Existing Data
Copy and paste the content from `migrate-quotation-data.sql`:

```sql
-- Migrate existing services
INSERT INTO quotation_services (
    quotation_id, event_id, service_id, quantity, package_type, unit_price, total_price, status
)
SELECT 
    qe.quotation_id,
    qe.id as event_id,
    (jsonb_array_elements(qe.selected_services)->>'id')::INTEGER as service_id,
    COALESCE((jsonb_array_elements(qe.selected_services)->>'quantity')::INTEGER, 1) as quantity,
    COALESCE(qe.selected_package, 'basic') as package_type,
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN s.basic_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN s.premium_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN s.elite_price
        ELSE s.basic_price
    END as unit_price,
    COALESCE((jsonb_array_elements(qe.selected_services)->>'quantity')::INTEGER, 1) * 
    CASE 
        WHEN COALESCE(qe.selected_package, 'basic') = 'basic' THEN s.basic_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'premium' THEN s.premium_price
        WHEN COALESCE(qe.selected_package, 'basic') = 'elite' THEN s.elite_price
        ELSE s.basic_price
    END as total_price,
    'active' as status
FROM quotation_events qe
JOIN services s ON s.id = (jsonb_array_elements(qe.selected_services)->>'id')::INTEGER
WHERE jsonb_array_length(qe.selected_services) > 0;

-- Migrate existing deliverables (similar query)
-- ... (see migrate-quotation-data.sql for complete script)
```

### Step 5: Verify Setup
Visit the admin endpoint to verify:
```
http://localhost:3000/api/admin/setup-quotation-tables
```

## 🎯 Benefits

### ✅ **For Current System:**
- **Better Performance**: Indexed relationships instead of JSON parsing
- **Data Integrity**: Foreign key constraints ensure valid references
- **Easier Queries**: Standard SQL joins instead of JSON operations

### ✅ **For Future Modules:**

#### **Shooter Scheduling Module:**
```sql
-- Get all services requiring shooters for a date range
SELECT s.servicename, qs.quotation_id, qe.event_date, qs.status
FROM quotation_services qs
JOIN services s ON s.id = qs.service_id  
JOIN quotation_events qe ON qe.id = qs.event_id
WHERE qe.event_date BETWEEN '2025-01-01' AND '2025-01-31'
AND qs.status = 'active'
ORDER BY qe.event_date;
```

#### **Post-Production Module:**
```sql
-- Track deliverable workflow status
SELECT d.deliverable_name, qd.status, qd.due_date, qd.completed_date
FROM quotation_deliverables qd
JOIN deliverables d ON d.id = qd.deliverable_id
WHERE qd.status IN ('pending', 'in_progress')
ORDER BY qd.due_date;
```

#### **Analytics & Reporting:**
```sql
-- Most popular services
SELECT s.servicename, COUNT(*) as bookings, SUM(qs.total_price) as revenue
FROM quotation_services qs
JOIN services s ON s.id = qs.service_id
WHERE qs.status = 'active'
GROUP BY s.id, s.servicename
ORDER BY bookings DESC;
```

## 🔧 Table Structure

### **quotation_services**
| Column | Type | Description |
|--------|------|-------------|
| `quotation_id` | INTEGER | Links to quotations table |
| `event_id` | INTEGER | Links to quotation_events table |
| `service_id` | INTEGER | Links to services table |
| `quantity` | INTEGER | Number of units |
| `package_type` | VARCHAR | basic/premium/elite/custom |
| `unit_price` | DECIMAL | Price per unit |
| `total_price` | DECIMAL | quantity × unit_price |
| `status` | VARCHAR | active/cancelled/completed |

### **quotation_deliverables**
| Column | Type | Description |
|--------|------|-------------|
| `quotation_id` | INTEGER | Links to quotations table |
| `event_id` | INTEGER | Links to quotation_events table |
| `deliverable_id` | INTEGER | Links to deliverables table |
| `quantity` | INTEGER | Number of units |
| `package_type` | VARCHAR | basic/premium/elite/custom |
| `unit_price` | DECIMAL | Price per unit |
| `total_price` | DECIMAL | quantity × unit_price |
| `status` | VARCHAR | pending/in_progress/completed/delivered |
| `due_date` | DATE | Expected delivery date |
| `completed_date` | DATE | Actual completion date |

## 🚧 Next Steps After Setup

1. **Update Quotation Creation Code** - Modify quotation forms to insert into new tables
2. **Update Quotation Display Code** - Modify quotation views to read from new tables  
3. **Create Workflow APIs** - Build APIs for status updates and workflow management
4. **Build Analytics Dashboards** - Leverage the normalized data for insights

This setup provides the foundation for your **shooter scheduling** and **post-production** modules! 