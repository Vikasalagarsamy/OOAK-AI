-- Create AI/ML tables for intelligent business insights

-- Table: quotation_predictions
-- Stores AI predictions for quotation success probability
CREATE TABLE IF NOT EXISTS quotation_predictions (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL,
  success_probability DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
  confidence_score DECIMAL(5,4) NOT NULL,
  prediction_factors JSONB NOT NULL DEFAULT '{}',
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actual_outcome TEXT CHECK (actual_outcome IN ('won', 'lost', 'pending', NULL)),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: client_insights
-- Stores AI-generated insights about clients
CREATE TABLE IF NOT EXISTS client_insights (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  sentiment_score DECIMAL(5,4), -- -1.0000 (negative) to 1.0000 (positive)
  engagement_level TEXT CHECK (engagement_level IN ('high', 'medium', 'low')),
  conversion_probability DECIMAL(5,4),
  preferred_communication_method TEXT,
  optimal_follow_up_time TEXT,
  price_sensitivity TEXT CHECK (price_sensitivity IN ('high', 'medium', 'low')),
  decision_timeline_days INTEGER,
  insights JSONB NOT NULL DEFAULT '{}',
  last_analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: action_recommendations
-- Stores AI-generated next-best-action recommendations
CREATE TABLE IF NOT EXISTS action_recommendations (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'follow_up', 'price_adjustment', 'add_services', 'schedule_meeting', 
    'send_samples', 'create_urgency', 'escalate_to_manager', 'custom_proposal'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  confidence_score DECIMAL(5,4) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  expected_impact JSONB NOT NULL DEFAULT '{}', -- conversion_boost, revenue_impact, etc.
  reasoning TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Table: revenue_forecasts
-- Stores AI-generated revenue predictions and trends
CREATE TABLE IF NOT EXISTS revenue_forecasts (
  id SERIAL PRIMARY KEY,
  forecast_period TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  predicted_revenue DECIMAL(15,2) NOT NULL,
  confidence_interval_low DECIMAL(15,2) NOT NULL,
  confidence_interval_high DECIMAL(15,2) NOT NULL,
  contributing_factors JSONB NOT NULL DEFAULT '{}',
  model_metrics JSONB NOT NULL DEFAULT '{}',
  actual_revenue DECIMAL(15,2),
  forecast_accuracy DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: business_trends
-- Stores trend analysis and pattern recognition results
CREATE TABLE IF NOT EXISTS business_trends (
  id SERIAL PRIMARY KEY,
  trend_type TEXT NOT NULL CHECK (trend_type IN (
    'conversion_rate', 'avg_deal_size', 'sales_cycle_length', 
    'seasonal_patterns', 'service_demand', 'pricing_trends'
  )),
  trend_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  trend_direction TEXT NOT NULL CHECK (trend_direction IN ('increasing', 'decreasing', 'stable')),
  trend_strength DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
  current_value DECIMAL(15,4) NOT NULL,
  previous_value DECIMAL(15,4) NOT NULL,
  percentage_change DECIMAL(8,4) NOT NULL,
  statistical_significance DECIMAL(5,4) NOT NULL,
  insights JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: ml_model_performance
-- Tracks performance metrics of ML models
CREATE TABLE IF NOT EXISTS ml_model_performance (
  id SERIAL PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'accuracy', 'precision', 'recall', 'f1_score', 'auc_roc', 'mae', 'rmse'
  )),
  metric_value DECIMAL(8,6) NOT NULL,
  dataset_size INTEGER NOT NULL,
  training_date TIMESTAMP WITH TIME ZONE NOT NULL,
  evaluation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_production_model BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotation_predictions_quotation_id ON quotation_predictions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_predictions_predicted_at ON quotation_predictions(predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_insights_client_name ON client_insights(client_name);
CREATE INDEX IF NOT EXISTS idx_client_insights_conversion_probability ON client_insights(conversion_probability DESC);
CREATE INDEX IF NOT EXISTS idx_action_recommendations_quotation_id ON action_recommendations(quotation_id);
CREATE INDEX IF NOT EXISTS idx_action_recommendations_priority ON action_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_action_recommendations_completed ON action_recommendations(is_completed);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_period ON revenue_forecasts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_business_trends_type ON business_trends(trend_type);
CREATE INDEX IF NOT EXISTS idx_business_trends_analyzed_at ON business_trends(analyzed_at DESC);

-- Enable RLS for all AI/ML tables
ALTER TABLE quotation_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on AI/ML tables" ON quotation_predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on client insights" ON client_insights FOR ALL USING (true);
CREATE POLICY "Allow all operations on action recommendations" ON action_recommendations FOR ALL USING (true);
CREATE POLICY "Allow all operations on revenue forecasts" ON revenue_forecasts FOR ALL USING (true);
CREATE POLICY "Allow all operations on business trends" ON business_trends FOR ALL USING (true);
CREATE POLICY "Allow all operations on ML performance" ON ml_model_performance FOR ALL USING (true); 