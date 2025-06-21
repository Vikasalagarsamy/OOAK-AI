-- Create Sales Team Performance Tracking Tables

-- Table: sales_team_members
-- Stores information about sales team members
CREATE TABLE IF NOT EXISTS sales_team_members (
  id SERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('sales_rep', 'senior_sales_rep', 'sales_manager', 'sales_head')),
  hire_date DATE NOT NULL,
  territory TEXT,
  target_monthly DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: sales_performance_metrics
-- Tracks individual sales rep performance over time
CREATE TABLE IF NOT EXISTS sales_performance_metrics (
  id SERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  metric_period DATE NOT NULL, -- Year-Month (e.g., 2024-03-01)
  quotations_created INTEGER NOT NULL DEFAULT 0,
  quotations_converted INTEGER NOT NULL DEFAULT 0,
  total_revenue_generated DECIMAL(15,2) NOT NULL DEFAULT 0,
  avg_deal_size DECIMAL(15,2) NOT NULL DEFAULT 0,
  avg_conversion_time_days INTEGER NOT NULL DEFAULT 0,
  follow_ups_completed INTEGER NOT NULL DEFAULT 0,
  client_meetings_held INTEGER NOT NULL DEFAULT 0,
  calls_made INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- 0.0000 to 1.0000
  activity_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0.00 to 10.00
  performance_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0.00 to 10.00
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (employee_id) REFERENCES sales_team_members(employee_id)
);

-- Table: sales_activities
-- Logs all sales activities for detailed tracking
CREATE TABLE IF NOT EXISTS sales_activities (
  id SERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  quotation_id INTEGER,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'quotation_created', 'quotation_sent', 'follow_up_call', 'follow_up_email',
    'client_meeting', 'site_visit', 'proposal_revision', 'negotiation',
    'contract_signed', 'deal_lost', 'client_referral'
  )),
  activity_description TEXT NOT NULL,
  activity_outcome TEXT,
  time_spent_minutes INTEGER DEFAULT 0,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  client_name TEXT,
  deal_value DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (employee_id) REFERENCES sales_team_members(employee_id)
);

-- Table: management_insights
-- Stores AI-generated insights and questions for management
CREATE TABLE IF NOT EXISTS management_insights (
  id SERIAL PRIMARY KEY,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'team_performance', 'individual_performance', 'process_improvement',
    'coaching_opportunity', 'recognition_suggestion', 'concern_alert'
  )),
  employee_id TEXT, -- NULL for team-wide insights
  priority TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  key_metrics JSONB NOT NULL DEFAULT '{}',
  suggested_questions JSONB NOT NULL DEFAULT '[]', -- Array of questions to ask
  recommended_actions JSONB NOT NULL DEFAULT '[]', -- Array of recommended actions
  confidence_score DECIMAL(5,4) NOT NULL,
  is_addressed BOOLEAN NOT NULL DEFAULT FALSE,
  addressed_at TIMESTAMP WITH TIME ZONE,
  addressed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (employee_id) REFERENCES sales_team_members(employee_id)
);

-- Table: team_performance_trends
-- Tracks overall team performance trends over time
CREATE TABLE IF NOT EXISTS team_performance_trends (
  id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_quotations INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  team_conversion_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  avg_deal_size DECIMAL(15,2) NOT NULL DEFAULT 0,
  avg_sales_cycle_days INTEGER NOT NULL DEFAULT 0,
  top_performer_id TEXT,
  underperformer_id TEXT,
  performance_variance DECIMAL(8,4) NOT NULL DEFAULT 0, -- How spread out performance is
  team_activity_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  coaching_opportunities INTEGER NOT NULL DEFAULT 0,
  process_improvements_needed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (top_performer_id) REFERENCES sales_team_members(employee_id),
  FOREIGN KEY (underperformer_id) REFERENCES sales_team_members(employee_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_team_members_employee_id ON sales_team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_team_members_role ON sales_team_members(role);
CREATE INDEX IF NOT EXISTS idx_sales_performance_metrics_employee_id ON sales_performance_metrics(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_performance_metrics_period ON sales_performance_metrics(metric_period DESC);
CREATE INDEX IF NOT EXISTS idx_sales_activities_employee_id ON sales_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_date ON sales_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_activities_quotation_id ON sales_activities(quotation_id);
CREATE INDEX IF NOT EXISTS idx_management_insights_priority ON management_insights(priority);
CREATE INDEX IF NOT EXISTS idx_management_insights_addressed ON management_insights(is_addressed);
CREATE INDEX IF NOT EXISTS idx_team_performance_trends_period ON team_performance_trends(period_start DESC);

-- Add unique constraint for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_performance_metrics_unique 
  ON sales_performance_metrics(employee_id, metric_period);

-- Enable RLS for all sales team tables
ALTER TABLE sales_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_performance_trends ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on sales team members" ON sales_team_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on sales performance metrics" ON sales_performance_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on sales activities" ON sales_activities FOR ALL USING (true);
CREATE POLICY "Allow all operations on management insights" ON management_insights FOR ALL USING (true);
CREATE POLICY "Allow all operations on team performance trends" ON team_performance_trends FOR ALL USING (true);

-- Insert sample sales team data for testing
INSERT INTO sales_team_members (employee_id, full_name, email, role, hire_date, territory, target_monthly) VALUES
('EMP001', 'Rajesh Kumar', 'rajesh.kumar@company.com', 'sales_rep', '2023-01-15', 'North Mumbai', 500000),
('EMP002', 'Priya Sharma', 'priya.sharma@company.com', 'senior_sales_rep', '2022-06-10', 'South Mumbai', 750000),
('EMP003', 'Amit Patel', 'amit.patel@company.com', 'sales_rep', '2023-08-20', 'Pune', 400000),
('EMP004', 'Sneha Singh', 'sneha.singh@company.com', 'sales_manager', '2021-03-05', 'Mumbai Region', 1200000),
('EMP005', 'Vikram Joshi', 'vikram.joshi@company.com', 'sales_rep', '2023-11-01', 'Thane', 350000);

-- Insert sample performance metrics
INSERT INTO sales_performance_metrics (employee_id, metric_period, quotations_created, quotations_converted, total_revenue_generated, avg_deal_size, conversion_rate, activity_score, performance_score) VALUES
('EMP001', '2024-03-01', 15, 8, 450000, 56250, 0.5333, 7.5, 7.8),
('EMP002', '2024-03-01', 22, 16, 890000, 55625, 0.7273, 9.2, 9.5),
('EMP003', '2024-03-01', 12, 5, 280000, 56000, 0.4167, 6.8, 6.2),
('EMP004', '2024-03-01', 8, 6, 650000, 108333, 0.7500, 8.5, 8.9),
('EMP005', '2024-03-01', 10, 4, 220000, 55000, 0.4000, 5.5, 5.8); 