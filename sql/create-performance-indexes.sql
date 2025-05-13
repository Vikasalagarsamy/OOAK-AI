-- Create indexes to optimize lead reassignment queries
-- Index on leads.assigned_to for faster lookup of leads by employee
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- Index on leads.status for faster filtering of leads by status
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Composite index for the common query pattern in our function
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads(assigned_to, status);

-- Index on employees.status for faster trigger activation
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Add ANALYZE to update statistics for the query planner
ANALYZE leads;
ANALYZE employees;
